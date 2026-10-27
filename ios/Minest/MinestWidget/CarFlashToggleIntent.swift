import ActivityKit
import AppIntents
import Foundation

// MARK: - Car flashcard Pause / Resume
//
// CarFlashToggleIntent (LiveActivityIntent): the button on the Lock Screen / Dynamic Island card and the Siri phrase
// ("暂停 Minest 闪卡"). iOS runs it in the Minest app process, which owns the Live Activity.
// CarFlashWidgetToggleIntent: the round button on the CarPlay Dashboard widget; it runs in the widget extension.
// Both flip the shared playlist (CarFlashStore); a running app follows through .minestCarFlashToggled / the Darwin note.
// This file is compiled into BOTH the app and the widget extension (identical copies in Minest/ and MinestWidget/).

public extension Notification.Name {
    static let minestCarFlashToggled = Notification.Name("MinestCarFlashToggled")
}

@available(iOS 17.0, *)
public struct CarFlashToggleIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "车载闪卡 暂停／继续"
    public static var description: IntentDescription = IntentDescription("暂停或继续车载闪卡的自动切换")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some IntentResult {
        guard let paused = CarFlashStore.toggle() else { return .result() }
        for activity in Activity<StudyActivityAttributes>.activities where activity.activityState == .active {
            var state = activity.content.state
            guard var flash = state.carFlash else { continue }
            flash.paused = paused
            state.carFlash = flash
            await activity.update(ActivityContent(state: state, staleDate: nil))
        }
        await MainActor.run {
            NotificationCenter.default.post(name: .minestCarFlashToggled, object: nil, userInfo: ["paused": paused])
        }
        return .result()
    }
}

@available(iOS 17.0, *)
public struct CarFlashWidgetToggleIntent: AppIntent {
    public static var title: LocalizedStringResource = "车载闪卡 暂停／继续（小组件）"
    public static var openAppWhenRun: Bool = false
    public static var isDiscoverable: Bool = false

    public init() {}

    public func perform() async throws -> some IntentResult {
        CarFlashStore.toggle()   // saves, reloads the widget timeline, tells a running app
        return .result()
    }
}

/// ⏭ on the CarPlay widget (and the Siri phrase "Minest 下一个闪卡"): the next word right away.
@available(iOS 17.0, *)
public struct CarFlashNextIntent: AppIntent {
    public static var title: LocalizedStringResource = "车载闪卡 下一个"
    public static var description: IntentDescription = IntentDescription("车载闪卡立即换到下一个单词")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some IntentResult {
        CarFlashStore.next()   // saves, reloads the widget timeline, tells a running app
        return .result()
    }
}

/// ★ on the CarPlay widget (left of Pause): mark the card on show to study more (or un-mark it).
@available(iOS 17.0, *)
public struct CarFlashStarIntent: AppIntent {
    public static var title: LocalizedStringResource = "车载闪卡 收藏"
    public static var description: IntentDescription = IntentDescription("收藏当前闪卡（需要进一步学习），再点一次取消")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some IntentResult {
        CarFlashStore.star()   // saves, reloads the widget timeline, tells a running app
        return .result()
    }
}
