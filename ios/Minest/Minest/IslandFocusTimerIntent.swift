import ActivityKit
import AppIntents
import Foundation

// MARK: - Dynamic Island focus timer intent (start / pause / stop)
//
// LiveActivityIntent so iOS runs perform() in the Minest app process, which is the only
// process allowed to update the Live Activity. This file is compiled into BOTH the app
// and the widget extension (identical copies in Minest/ and MinestWidget/).

@available(iOS 17.0, *)
public struct IslandFocusTimerIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "专注计时"
    public static var description: IntentDescription = IntentDescription("在灵动岛上开始、暂停或停止专注计时")
    public static var openAppWhenRun: Bool = false

    @Parameter(title: "操作", default: "start")
    public var action: String

    public init() {}

    public init(action: String) {
        self.action = action
    }

    public func perform() async throws -> some IntentResult {
        for activity in Activity<StudyActivityAttributes>.activities where activity.activityState == .active {
            var state = activity.content.state
            var timer = state.timer ?? StudyActivityAttributes.FocusTimerState()
            let now = Date()
            switch action {
            case "start":
                // A stopped session that was never committed is replaced by a fresh one
                if timer.stoppedSeconds != nil { timer = StudyActivityAttributes.FocusTimerState() }
                if timer.runningSince == nil { timer.runningSince = now }
            case "pause":
                if let since = timer.runningSince {
                    timer.accumulated += now.timeIntervalSince(since)
                    timer.runningSince = nil
                }
            case "stop":
                let total = timer.elapsed(at: now)
                timer.runningSince = nil
                timer.accumulated = total
                timer.stoppedSeconds = total
            default:
                break
            }
            state.timer = timer
            await activity.update(ActivityContent(state: state, staleDate: nil))
        }
        return .result()
    }
}

