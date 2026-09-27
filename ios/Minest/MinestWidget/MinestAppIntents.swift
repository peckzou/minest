import AppIntents
import ActivityKit
import WidgetKit

/// Interactive App Intent for iOS 17+ Live Activity, WidgetKit, Control Center & Dynamic Island
@available(iOS 17.0, *)
public struct CompleteCardIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "完成当前任务"
    public static var description: IntentDescription = IntentDescription("在锁屏或灵动岛上直接将当前卡片/清单任务标记为完成")
    
    public init() {}
    
    public func perform() async throws -> some IntentResult {
        for activity in Activity<StudyActivityAttributes>.activities {
            let current = activity.content.state
            let newCompleted = min(current.completedCount + 1, current.totalCount)
            let isAllDone = (newCompleted >= current.totalCount)
            
            let updatedState = StudyActivityAttributes.ContentState(
                completedCount: newCompleted,
                totalCount: current.totalCount,
                cardTitle: current.cardTitle,
                itemText: isAllDone ? "全部达成 🎉" : current.itemText,
                mode: current.mode,
                remainingMinutes: current.remainingMinutes,
                isAllDone: isAllDone
            )
            
            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
        }
        
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

/// Interactive App Intent to start focus activity
@available(iOS 17.0, *)
public struct StartFocusIntent: AppIntent {
    public static var title: LocalizedStringResource = "开启专注模式"
    public static var description: IntentDescription = IntentDescription("在灵动岛与锁屏上启动实时看板专注")
    public static var openAppWhenRun: Bool = false
    
    @Parameter(title: "任务名称", default: "深度专注")
    public var cardTitle: String
    
    public init() {
        self.cardTitle = "深度专注"
    }
    
    public init(cardTitle: String) {
        self.cardTitle = cardTitle
    }
    
    public func perform() async throws -> some IntentResult {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            let active = Activity<StudyActivityAttributes>.activities
            if let first = active.first {
                let newState = StudyActivityAttributes.ContentState(
                    completedCount: first.content.state.completedCount,
                    totalCount: first.content.state.totalCount,
                    cardTitle: cardTitle,
                    itemText: "专注进行中...",
                    mode: "countdown",
                    remainingMinutes: 25,
                    isAllDone: false
                )
                await first.update(ActivityContent(state: newState, staleDate: nil))
            } else {
                let attributes = StudyActivityAttributes(boardTitle: "Minest 看板")
                let state = StudyActivityAttributes.ContentState(
                    completedCount: 0,
                    totalCount: 3,
                    cardTitle: cardTitle,
                    itemText: "专注中",
                    mode: "countdown",
                    remainingMinutes: 25,
                    isAllDone: false
                )
                do {
                    _ = try Activity.request(
                        attributes: attributes,
                        content: .init(state: state, staleDate: nil),
                        pushType: nil
                    )
                } catch {
                    print("Failed to start activity from intent: \(error)")
                }
            }
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

/// Interactive App Intent to end active focus activity
@available(iOS 17.0, *)
public struct EndFocusIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "结束专注"
    public static var description: IntentDescription = IntentDescription("结束当前灵动岛实时活动")
    
    public init() {}
    
    public func perform() async throws -> some IntentResult {
        for activity in Activity<StudyActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

/// Interactive App Intent to draw/deal a random study card
@available(iOS 17.0, *)
public struct DrawRandomCardIntent: AppIntent {
    public static var title: LocalizedStringResource = "随机抽卡学习"
    public static var description: IntentDescription = IntentDescription("在 Minest 看板中随机抽取一张卡片进行专注或记忆复习")
    public static var openAppWhenRun: Bool = true
    
    public init() {}
    
    public func perform() async throws -> some IntentResult {
        for activity in Activity<StudyActivityAttributes>.activities {
            let current = activity.content.state
            let updatedState = StudyActivityAttributes.ContentState(
                completedCount: current.completedCount,
                totalCount: current.totalCount,
                cardTitle: "抽卡挑战 · 专注进行",
                itemText: "已为你抽取卡片，进入 App 翻转查看",
                mode: current.mode,
                remainingMinutes: current.remainingMinutes,
                isAllDone: false
            )
            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

/// Interactive App Intent to toggle a checklist item directly from Dynamic Island or Home Screen Widget
@available(iOS 17.0, *)
public struct ToggleChecklistItemIntent: AppIntent {
    public static var title: LocalizedStringResource = "切换清单勾选状态"
    public static var description: IntentDescription = IntentDescription("在桌面小组件或灵动岛中直接勾选或取消勾选清单项")
    
    @Parameter(title: "任务ID")
    public var itemId: String
    
    public init() {
        self.itemId = ""
    }
    
    public init(itemId: String) {
        self.itemId = itemId
    }
    
    public func perform() async throws -> some IntentResult {
        // 1. Toggle in active Live Activity
        for activity in Activity<StudyActivityAttributes>.activities {
            var currentItems = activity.content.state.items
            if let idx = currentItems.firstIndex(where: { $0.id == itemId }) {
                currentItems[idx].isDone.toggle()
            }
            let doneCount = currentItems.filter { $0.isDone }.count
            let totalCount = currentItems.count
            let isAllDone = (doneCount >= totalCount && totalCount > 0)
            
            let updatedState = StudyActivityAttributes.ContentState(
                completedCount: doneCount,
                totalCount: max(totalCount, 1),
                cardTitle: activity.content.state.cardTitle,
                itemText: isAllDone ? "全部达成 🎉" : (currentItems.first(where: { !$0.isDone })?.text ?? "已全部完成"),
                mode: activity.content.state.mode,
                remainingMinutes: activity.content.state.remainingMinutes,
                isAllDone: isAllDone,
                items: currentItems
            )
            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
        }
        
        // 2. Toggle in Widget Store
        MinestWidgetDataStore.shared.toggleItem(id: itemId)
        WidgetCenter.shared.reloadAllTimelines()
        
        return .result()
    }
}
