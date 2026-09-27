import AppIntents
import ActivityKit
import WidgetKit
import SwiftUI

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
        NativeSoundAndHaptics.shared.playCardShuffle()
        NativeMotionManager.shared.handleShakeDetected()
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

/// Interactive App Intent to create a new study card or task via Siri & Shortcuts (like Apple Reminders)
@available(iOS 17.0, *)
public struct CreateCardIntent: AppIntent {
    public static var title: LocalizedStringResource = "新建卡片"
    public static var description: IntentDescription = IntentDescription("通过 Siri 或快捷指令在 Minest 中新建学习卡片或清单待办，类似 Apple Reminders")
    public static var openAppWhenRun: Bool = false
    
    @Parameter(
        title: "卡片标题",
        description: "要创建的卡片或学习任务标题",
        requestValueDialog: IntentDialog("卡片的标题是什么？")
    )
    public var title: String
    
    @Parameter(
        title: "看板分类",
        description: "卡片归属的板块或科目",
        default: "学习看板"
    )
    public var category: String
    
    @Parameter(
        title: "初始子任务",
        description: "卡片内的待办清单事项（可选）",
        default: ""
    )
    public var initialTask: String?
    
    public init() {
        self.title = ""
        self.category = "学习看板"
        self.initialTask = ""
    }
    
    public init(title: String, category: String = "学习看板", initialTask: String? = nil) {
        self.title = title
        self.category = category
        self.initialTask = initialTask
    }
    
    public func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let effectiveTitle = trimmedTitle.isEmpty ? "未命名卡片" : trimmedTitle
        let itemId = "card-\(UUID().uuidString.prefix(6))"
        let effectiveTask = (initialTask?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false) ? initialTask! : effectiveTitle
        
        // 1. Persist to MinestWidgetDataStore for Home Screen widgets & offline sync
        MinestWidgetDataStore.shared.addCard(
            id: itemId,
            title: effectiveTitle,
            category: category,
            initialItem: effectiveTask
        )
        
        // 2. Real-time Dynamic Island & Live Activity update
        for activity in Activity<StudyActivityAttributes>.activities {
            var currentItems = activity.content.state.items
            let newItem = StudyActivityAttributes.ChecklistItemState(
                id: itemId,
                text: effectiveTask,
                isDone: false
            )
            currentItems.insert(newItem, at: 0)
            let totalCount = currentItems.count
            let doneCount = currentItems.filter { $0.isDone }.count
            
            let updatedState = StudyActivityAttributes.ContentState(
                completedCount: doneCount,
                totalCount: max(totalCount, 1),
                cardTitle: effectiveTitle,
                itemText: newItem.text,
                mode: activity.content.state.mode,
                remainingMinutes: activity.content.state.remainingMinutes,
                isAllDone: false,
                items: currentItems
            )
            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
        }
        
        // 3. Trigger audio-haptic feedback
        NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
        
        // 4. Reload all desktop widgets
        WidgetCenter.shared.reloadAllTimelines()
        
        // 5. Notify app if running in foreground
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("MinestCreateCardNotification"),
                object: nil,
                userInfo: [
                    "id": itemId,
                    "title": effectiveTitle,
                    "category": category,
                    "item": effectiveTask
                ]
            )
        }
        
        return .result(
            dialog: IntentDialog("已为你将「\(effectiveTitle)」添加到 Minest 卡片看板。"),
            view: SiriCardSnippetView(title: effectiveTitle, category: category, item: effectiveTask)
        )
    }
}

/// Siri interactive visual confirmation snippet view
@available(iOS 17.0, *)
public struct SiriCardSnippetView: View {
    let title: String
    let category: String
    let item: String
    
    public var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 22/255, green: 101/255, blue: 52/255).opacity(0.45))
                    .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(red: 74/255, green: 222/255, blue: 128/255).opacity(0.4), lineWidth: 1)
                    )
                
                Image(systemName: "plus.rectangle.on.rectangle.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(Color(red: 74/255, green: 222/255, blue: 128/255))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                HStack(spacing: 6) {
                    Text(category)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Color(red: 74/255, green: 222/255, blue: 128/255))
                    
                    Text("• 已同步至灵动岛与小组件")
                        .font(.system(size: 11))
                        .foregroundColor(Color.white.opacity(0.6))
                }
            }
            
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 22))
                .foregroundColor(Color(red: 74/255, green: 222/255, blue: 128/255))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(red: 15/255, green: 23/255, blue: 42/255))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

/// Siri & iPhone 15 Pro Action Button App Shortcuts
@available(iOS 17.0, *)
public struct MinestShortcuts: AppShortcutsProvider {
    public static var shortcutTileColor: ShortcutTileColor = .teal
    
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CreateCardIntent(),
            phrases: [
                "\(.applicationName) add",
                "\(.applicationName) add card",
                "\(.applicationName) add task",
                "\(.applicationName) 新建",
                "\(.applicationName) 新增",
                "\(.applicationName) 添加",
                "\(.applicationName) 加上",
                "\(.applicationName) 记一下",
                "在 \(.applicationName) 中新建卡片",
                "用 \(.applicationName) 记录卡片",
                "在 \(.applicationName) 添加任务",
                "用 \(.applicationName) 提醒我",
                "Create a card in \(.applicationName)",
                "Add task in \(.applicationName)"
            ],
            shortTitle: "新建卡片",
            systemImageName: "plus.rectangle.on.rectangle.fill"
        )
        AppShortcut(
            intent: StartFocusIntent(),
            phrases: [
                "在 \(.applicationName) 中开始专注",
                "开启 \(.applicationName) 专注",
                "Start focus in \(.applicationName)"
            ],
            shortTitle: "开始专注",
            systemImageName: "timer"
        )
        AppShortcut(
            intent: CompleteCardIntent(),
            phrases: [
                "在 \(.applicationName) 中完成任务",
                "标记 \(.applicationName) 卡片完成",
                "Complete task in \(.applicationName)"
            ],
            shortTitle: "完成任务",
            systemImageName: "checkmark.circle.fill"
        )
        AppShortcut(
            intent: DrawRandomCardIntent(),
            phrases: [
                "在 \(.applicationName) 中随机抽卡",
                "在 \(.applicationName) 抽签学习",
                "Draw card in \(.applicationName)"
            ],
            shortTitle: "随机抽卡",
            systemImageName: "sparkles.rectangle.stack.fill"
        )
    }
}
