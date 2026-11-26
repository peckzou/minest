import Foundation
import WatchConnectivity
import WatchKit
import SwiftUI
import Combine

// MARK: - Models

public struct WatchTaskItem: Identifiable, Codable, Hashable, Equatable {
    public let id: String
    public var text: String
    public var isDone: Bool
    public var timestamp: Date
    
    public init(id: String = UUID().uuidString, text: String, isDone: Bool = false, timestamp: Date = Date()) {
        self.id = id
        self.text = text
        self.isDone = isDone
        self.timestamp = timestamp
    }
}

public struct WatchCardModel: Identifiable, Codable, Hashable, Equatable {
    public let id: String
    public var title: String
    public var isCompleted: Bool
    public var category: String
    public var hasChecklist: Bool
    public var items: [WatchTaskItem]
    
    public var completedCount: Int {
        items.filter { $0.isDone }.count
    }
    public var totalCount: Int {
        items.count
    }
    public var progress: Double {
        guard totalCount > 0 else { return isCompleted ? 1.0 : 0.0 }
        return Double(completedCount) / Double(totalCount)
    }
    
    public init(
        id: String = UUID().uuidString,
        title: String,
        isCompleted: Bool = false,
        category: String = "卡片",
        hasChecklist: Bool = false,
        items: [WatchTaskItem] = []
    ) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.category = category
        self.hasChecklist = hasChecklist || !items.isEmpty
        self.items = items
    }
}

public struct WatchListModel: Identifiable, Codable, Hashable, Equatable {
    public let id: String
    public var name: String
    public var icon: String
    public var colorHex: String
    public var boardId: String
    public var cards: [WatchCardModel]
    
    public var totalCardsCount: Int {
        cards.count
    }
    public var completedCardsCount: Int {
        cards.filter { $0.isCompleted }.count
    }
    public var totalChecklistCount: Int {
        cards.reduce(0) { $0 + $1.totalCount }
    }
    public var completedChecklistCount: Int {
        cards.reduce(0) { $0 + $1.completedCount }
    }
    
    public init(
        id: String = UUID().uuidString,
        name: String,
        icon: String = "list.bullet",
        colorHex: String = "#22C55E",
        boardId: String = "",
        cards: [WatchCardModel] = []
    ) {
        self.id = id
        self.name = name
        self.icon = icon
        self.colorHex = colorHex
        self.boardId = boardId
        self.cards = cards
    }
}

public struct WatchBoardModel: Identifiable, Codable, Hashable, Equatable {
    public let id: String
    public var title: String
    public var icon: String
    public var colorHex: String
    public var lists: [WatchListModel]
    
    public var totalCardsCount: Int {
        lists.reduce(0) { $0 + $1.totalCardsCount }
    }
    public var completedCardsCount: Int {
        lists.reduce(0) { $0 + $1.completedCardsCount }
    }
    
    public init(
        id: String = UUID().uuidString,
        title: String,
        icon: String = "folder.fill",
        colorHex: String = "#22C55E",
        lists: [WatchListModel] = []
    ) {
        self.id = id
        self.title = title
        self.icon = icon
        self.colorHex = colorHex
        self.lists = lists
    }
}

// MARK: - Activity Rings & Digital Badges Models

public struct ActivityRingsState: Codable, Hashable, Equatable {
    // Ring 1: 专注时长闭环 (Red)
    public var focusMinutes: Int
    public var targetMinutes: Int
    
    // Ring 2: 打勾进阶闭环 (Green)
    public var checkCount: Int
    public var targetChecks: Int
    
    // Ring 3: 每日目标闭环 (Cyan)
    public var goalPercent: Int // 0..100
    // Watch 4.0: user-set goal % (optional so older caches still decode; nil = 100%)
    public var targetGoalPercent: Int?
    // 31.6: Strike days from the iPhone (optional so older caches still decode)
    public var strikeDays: Int?

    public var goalTarget: Int {
        max(targetGoalPercent ?? 100, 1)
    }
    
    public var focusProgress: Double {
        guard targetMinutes > 0 else { return 0 }
        return Double(focusMinutes) / Double(targetMinutes)
    }
    
    public var checkProgress: Double {
        guard targetChecks > 0 else { return 0 }
        return Double(checkCount) / Double(targetChecks)
    }
    
    public var goalProgress: Double {
        return Double(max(goalPercent, 0)) / Double(goalTarget)
    }
    
    public var closedRingsCount: Int {
        var count = 0
        if focusMinutes >= targetMinutes && targetMinutes > 0 { count += 1 }
        if checkCount >= targetChecks && targetChecks > 0 { count += 1 }
        if goalPercent >= goalTarget { count += 1 }
        return count
    }
    
    public var isAllClosed: Bool {
        closedRingsCount >= 3
    }
    
    public init(
        focusMinutes: Int = 18,
        targetMinutes: Int = 30,
        checkCount: Int = 6,
        targetChecks: Int = 10,
        goalPercent: Int = 65
    ) {
        self.focusMinutes = focusMinutes
        self.targetMinutes = targetMinutes
        self.checkCount = checkCount
        self.targetChecks = targetChecks
        self.goalPercent = goalPercent
    }
}

public struct WatchBadgeModel: Identifiable, Codable, Hashable, Equatable {
    public let id: String
    public var title: String
    public var subtitle: String
    public var icon: String
    public var colorHex: String
    public var isUnlocked: Bool
    public var unlockedDate: Date?
    
    public init(
        id: String,
        title: String,
        subtitle: String,
        icon: String,
        colorHex: String,
        isUnlocked: Bool = false,
        unlockedDate: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.colorHex = colorHex
        self.isUnlocked = isUnlocked
        self.unlockedDate = unlockedDate
    }
}

/// 31.6: full-screen moments mirrored from the iPhone.
public enum WatchCeremony: Identifiable, Equatable {
    case rings(strikeDays: Int)
    case claim(badgeId: String)

    public var id: String {
        switch self {
        case .rings(let days): return "rings-\(days)"
        case .claim(let badgeId): return "claim-\(badgeId)"
        }
    }
}

// MARK: - WatchSyncManager

/// Watch-side data sync manager connecting to iPhone via WCSession
/// Complete hierarchy: Boards -> Lists -> Cards (Checkable) -> Sub-Checklists + 3-Ring Activity & Badges
public final class WatchSyncManager: NSObject, ObservableObject, WCSessionDelegate {
    public static let shared = WatchSyncManager()
    
    @Published public var boards: [WatchBoardModel] = []
    @Published public var selectedBoardId: String = "board-ec6-outline"
    @Published public var selectedListId: String = "col-lm"
    @Published public var isReachable: Bool = false
    @Published public var lastSyncDate: Date = Date()
    
    // 3-Ring Activity & Digital Badges
    @Published public var ringsState: ActivityRingsState = ActivityRingsState()
    /// Watch 4.0: true while a focus workout is counting or paused
    public var isFocusWorkoutActive: Bool = false
    @Published public var badges: [WatchBadgeModel] = WatchSyncManager.makeDefaultBadges()
    
    /// 31.6: ids unlocked on the iPhone Badge Wall (claim-only), mirrored from the phone.
    @Published public var wallUnlockedIds: Set<String> = WatchSyncManager.loadWallUnlockedIds()
    private static let wallUnlockedKey = "minest_watch_badge_wall_v1"

    private static func loadWallUnlockedIds() -> Set<String> {
        Set(UserDefaults.standard.stringArray(forKey: wallUnlockedKey) ?? [])
    }

    private static let wallSyncedOnceKey = "minest_watch_badge_wall_synced_v1"
    private static let ringsCelebratedKey = "minest_watch_rings_celebrated_day_v1"

    private func applyBadgeWall(_ wall: [String: Any]) {
        guard let ids = wall["unlockedIds"] as? [String] else { return }
        let next = Set(ids)
        let firstSync = !UserDefaults.standard.bool(forKey: Self.wallSyncedOnceKey)
        UserDefaults.standard.set(true, forKey: Self.wallSyncedOnceKey)
        guard next != wallUnlockedIds else { return }
        let gained = next.subtracting(wallUnlockedIds)
        wallUnlockedIds = next
        UserDefaults.standard.set(Array(next), forKey: Self.wallUnlockedKey)
        // The very first sync just mirrors the wall; later new unlocks get a claim ceremony.
        guard !firstSync, !gained.isEmpty else { return }
        let order = WatchWallBadge.catalog.map { $0.id }
        gained.sorted { (order.firstIndex(of: $0) ?? .max) < (order.firstIndex(of: $1) ?? .max) }
            .prefix(3)
            .forEach { enqueueCeremony(.claim(badgeId: $0)) }
    }

    // MARK: - 31.6 Ceremonies (three-ring close, badge claim)

    @Published public var activeCeremony: WatchCeremony? = nil
    /// How many full-screen sheets are open above the root (0 = rings page).
    @Published public var sheetLevel: Int = 0
    private var ceremonyQueue: [WatchCeremony] = []

    public func enqueueCeremony(_ ceremony: WatchCeremony) {
        if activeCeremony == nil { activeCeremony = ceremony } else { ceremonyQueue.append(ceremony) }
    }

    public func finishCeremony() {
        activeCeremony = nil
        guard !ceremonyQueue.isEmpty else { return }
        let next = ceremonyQueue.removeFirst()
        // Let the previous full-screen cover dismiss before presenting the next one.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { self.activeCeremony = next }
    }

    /// Celebrate once per day the first time all three rings are closed.
    public func checkRingsCelebration() {
        guard ringsState.isAllClosed else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        guard UserDefaults.standard.string(forKey: Self.ringsCelebratedKey) != today else { return }
        UserDefaults.standard.set(today, forKey: Self.ringsCelebratedKey)
        // Rings first, ahead of any badge claims already waiting.
        if let current = activeCeremony { ceremonyQueue.insert(current, at: 0) }
        activeCeremony = .rings(strikeDays: ringsState.strikeDays ?? 0)
    }

    public var unlockedBadgesCount: Int {
        badges.filter { $0.isUnlocked }.count
    }
    
    public var currentBoard: WatchBoardModel? {
        boards.first(where: { $0.id == selectedBoardId }) ?? boards.first
    }
    
    public var currentLists: [WatchListModel] {
        currentBoard?.lists ?? []
    }
    
    public var currentList: WatchListModel? {
        currentLists.first(where: { $0.id == selectedListId }) ?? currentLists.first
    }
    
    public var currentCard: WatchCardModel? {
        currentList?.cards.first(where: { $0.hasChecklist }) ?? currentList?.cards.first
    }
    
    // Legacy compatibility helpers
    public var lists: [WatchListModel] {
        get { currentLists }
        set {
            if let bIdx = boards.firstIndex(where: { $0.id == selectedBoardId }) {
                boards[bIdx].lists = newValue
            }
        }
    }
    public var items: [WatchTaskItem] {
        get { currentCard?.items ?? [] }
        set {
            if let cardId = currentCard?.id {
                updateCardItems(cardId: cardId, newItems: newValue)
            }
        }
    }
    public var boardTitle: String {
        currentBoard?.title ?? "Minest 看板"
    }
    public var cardTitle: String {
        currentList?.name ?? "随身复习"
    }
    
    private let boardsCacheKey = "minest_watch_cached_boards_v3"
    private let selectedBoardKey = "minest_watch_selected_board_id"
    private let selectedListKey = "minest_watch_selected_list_id"
    private let ringsStateCacheKey = "minest_watch_rings_state_v1"
    private let badgesCacheKey = "minest_watch_badges_v1"
    
    private var minuteTimer: Timer?
    
    public override init() {
        super.init()
        loadLocalCache()
        setupWCSession()
        startMinuteTimer()
    }
    
    private func startMinuteTimer() {
        minuteTimer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: true) { [weak self] _ in
            // Watch 4.0: a running focus workout commits its own minutes on End
            guard let self = self, !self.isFocusWorkoutActive else { return }
            self.addFocusMinutes(1)
        }
    }
    
    private func setupWCSession() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    // MARK: - Local Cache & Defaults
    
    private func loadLocalCache() {
        if let data = UserDefaults.standard.data(forKey: boardsCacheKey),
           let decoded = try? JSONDecoder().decode([WatchBoardModel].self, from: data),
           !decoded.filter({ !Self.retiredBoardIds.contains($0.id) }).isEmpty {
            self.boards = decoded.filter { !Self.retiredBoardIds.contains($0.id) }   // the retired defaults leave a cached list too
        } else {
            self.boards = Self.makeDefaultBoards()
        }
        
        let savedBoardId = UserDefaults.standard.string(forKey: selectedBoardKey) ?? ""
        if boards.contains(where: { $0.id == savedBoardId }) {
            self.selectedBoardId = savedBoardId
        } else {
            self.selectedBoardId = boards.first?.id ?? "board-ec6-outline"
        }
        
        let savedListId = UserDefaults.standard.string(forKey: selectedListKey) ?? ""
        if currentLists.contains(where: { $0.id == savedListId }) {
            self.selectedListId = savedListId
        } else {
            self.selectedListId = currentLists.first?.id ?? "col-lm"
        }
        
        if let rData = UserDefaults.standard.data(forKey: ringsStateCacheKey),
           let rDecoded = try? JSONDecoder().decode(ActivityRingsState.self, from: rData) {
            self.ringsState = rDecoded
        }
        
        if let bData = UserDefaults.standard.data(forKey: badgesCacheKey),
           let bDecoded = try? JSONDecoder().decode([WatchBadgeModel].self, from: bData),
           !bDecoded.isEmpty {
            self.badges = bDecoded
        } else {
            self.badges = Self.makeDefaultBadges()
        }
    }
    
    public func saveLocalCache() {
        if let data = try? JSONEncoder().encode(boards) {
            UserDefaults.standard.set(data, forKey: boardsCacheKey)
        }
        UserDefaults.standard.set(selectedBoardId, forKey: selectedBoardKey)
        UserDefaults.standard.set(selectedListId, forKey: selectedListKey)
        
        if let rData = try? JSONEncoder().encode(ringsState) {
            UserDefaults.standard.set(rData, forKey: ringsStateCacheKey)
        }
        if let bData = try? JSONEncoder().encode(badges) {
            UserDefaults.standard.set(bData, forKey: badgesCacheKey)
        }
    }
    
    public static func makeDefaultBadges() -> [WatchBadgeModel] {
        [
            WatchBadgeModel(
                id: "badge-perfect-closure",
                title: "三圈圆满",
                subtitle: "完成今日全部三圈闭环",
                icon: "sparkles",
                colorHex: "#FFD700",
                isUnlocked: false
            ),
            WatchBadgeModel(
                id: "badge-deep-focus",
                title: "心流大师",
                subtitle: "今日专注时长达到30分钟",
                icon: "flame.fill",
                colorHex: "#FA114F",
                isUnlocked: true,
                unlockedDate: Date().addingTimeInterval(-86400)
            ),
            WatchBadgeModel(
                id: "badge-lightning-check",
                title: "神速打勾",
                subtitle: "今日打勾卡片达到10次",
                icon: "bolt.fill",
                colorHex: "#30D158",
                isUnlocked: true,
                unlockedDate: Date()
            ),
            WatchBadgeModel(
                id: "badge-list-conqueror",
                title: "清单征服",
                subtitle: "任意清单卡片100%全清",
                icon: "target",
                colorHex: "#00FFF0",
                isUnlocked: true,
                unlockedDate: Date()
            ),
            WatchBadgeModel(
                id: "badge-streak-fire",
                title: "持续连胜",
                subtitle: "连续达成活动闭环成就",
                icon: "crown.fill",
                colorHex: "#F59E0B",
                isUnlocked: false
            ),
            WatchBadgeModel(
                id: "badge-grandmaster",
                title: "终极大师",
                subtitle: "累计完成全部卡片复习任务",
                icon: "medal.fill",
                colorHex: "#A855F7",
                isUnlocked: false
            )
        ]
    }
    
    /// Built-in boards, the same as the phone's (2026-11-25): EC6 Outline (8 lists, 399 cards) and EC6 Glossary (5 lists,
    /// 274 terms), from philosophers-island/ec6. The retired defaults (Peck Learning System v1, EC-6 Learning Plan,
    /// EC-6 Vocabulary Library, Learning Map) are gone; boards sent from the phone replace these as before.
    public static let retiredBoardIds: Set<String> = ["board-peck-v1", "board-ec6-learning-plan", "board-ec6-vocabulary", "board-learning-map"]
    private static let defaultBoardsJSON = #"""
[{"id":"board-ec6-outline","title":"EC6 Outline","icon":"graduationcap.fill","color":"#10B981","lists":[{"id":"kl-kb-ec6-study-20261125-start","name":"开始与学习路线","cards":[["kc-kb-ec6-study-20261125-start-1","如何使用这套看板"],["kc-kb-ec6-study-20261125-start-2","391 与 STR 293 分开"],["kc-kb-ec6-study-20261125-start-3","三种信息不要混在一起"],["kc-kb-ec6-study-20261125-start-4","怎样判断“会了”"],["kc-kb-ec6-study-20261125-start-5","第一轮五科诊断"],["kc-kb-ec6-study-20261125-start-6","每日一次闭环"],["kc-kb-ec6-study-20261125-start-7","按技能看有哪些条"],["kc-kb-ec6-study-20261125-start-8","按知识点和 Anchor Chart 看"],["kc-kb-ec6-study-20261125-start-9","五科各有一个主要呈现方式"],["kc-kb-ec6-study-20261125-start-10","把错题变成下一张学习卡"]]},{"id":"kl-kb-ec6-study-20261125-knowledge","name":"考纲与知识点","cards":[["kc-kb-ec6-study-20261125-901-001-knowledge","901-001 口语与互动 · 知识"],["kc-kb-ec6-study-20261125-901-002-knowledge","901-002 词形分析与识词 · 知识"],["kc-kb-ec6-study-20261125-901-003-knowledge","901-003 阅读流畅度 · 知识"],["kc-kb-ec6-study-20261125-901-004-knowledge","901-004 理解与文学分析 · 知识"],["kc-kb-ec6-study-20261125-901-005-knowledge","901-005 词汇教学 · 知识"],["kc-kb-ec6-study-20261125-901-006-knowledge","901-006 探究与研究 · 知识"],["kc-kb-ec6-study-20261125-901-007-knowledge","901-007 书写规范 · 知识"],["kc-kb-ec6-study-20261125-901-008-knowledge","901-008 写作与交流 · 知识"],["kc-kb-ec6-study-20261125-901-009-knowledge","901-009 视觉与媒体素养 · 知识"],["kc-kb-ec6-study-20261125-901-010-knowledge","901-010 读写评估与干预 · 知识"],["kc-kb-ec6-study-20261125-902-001-knowledge","902-001 数学教学 · 知识"],["kc-kb-ec6-study-20261125-902-002-knowledge","902-002 数与运算 · 知识"],["kc-kb-ec6-study-20261125-902-003-knowledge","902-003 模式与代数 · 知识"],["kc-kb-ec6-study-20261125-902-004-knowledge","902-004 几何与测量 · 知识"],["kc-kb-ec6-study-20261125-902-005-knowledge","902-005 概率与统计 · 知识"],["kc-kb-ec6-study-20261125-902-006-knowledge","902-006 数学问题解决 · 知识"],["kc-kb-ec6-study-20261125-903-001-knowledge","903-001 社会科学探究教学 · 知识"],["kc-kb-ec6-study-20261125-903-002-knowledge","903-002 历史与变化 · 知识"],["kc-kb-ec6-study-20261125-903-003-knowledge","903-003 地理与文化 · 知识"],["kc-kb-ec6-study-20261125-903-004-knowledge","903-004 经济与选择 · 知识"],["kc-kb-ec6-study-20261125-903-005-knowledge","903-005 政府与公民 · 知识"],["kc-kb-ec6-study-20261125-904-001-knowledge","904-001 实验过程与安全 · 知识"],["kc-kb-ec6-study-20261125-904-002-knowledge","904-002 科学的本质与发展 · 知识"],["kc-kb-ec6-study-20261125-904-003-knowledge","904-003 科学技术与社会 · 知识"],["kc-kb-ec6-study-20261125-904-004-knowledge","904-004 系统、模型与跨学科概念 · 知识"],["kc-kb-ec6-study-20261125-904-005-knowledge","904-005 科学学习与教学 · 知识"],["kc-kb-ec6-study-20261125-904-006-knowledge","904-006 科学评估 · 知识"],["kc-kb-ec6-study-20261125-904-007-knowledge","904-007 力与运动 · 知识"],["kc-kb-ec6-study-20261125-904-008-knowledge","904-008 物质性质与变化 · 知识"],["kc-kb-ec6-study-20261125-904-009-knowledge","904-009 能量与相互作用 · 知识"],["kc-kb-ec6-study-20261125-904-010-knowledge","904-010 能量转化与守恒 · 知识"],["kc-kb-ec6-study-20261125-904-011-knowledge","904-011 生命结构与功能 · 知识"],["kc-kb-ec6-study-20261125-904-012-knowledge","904-012 繁殖与遗传 · 知识"],["kc-kb-ec6-study-20261125-904-013-knowledge","904-013 适应与演化 · 知识"],["kc-kb-ec6-study-20261125-904-014-knowledge","904-014 生物与环境 · 知识"],["kc-kb-ec6-study-20261125-904-015-knowledge","904-015 地球系统与地貌 · 知识"],["kc-kb-ec6-study-20261125-904-016-knowledge","904-016 地球中的循环 · 知识"],["kc-kb-ec6-study-20261125-904-017-knowledge","904-017 天气与气候 · 知识"],["kc-kb-ec6-study-20261125-904-018-knowledge","904-018 地月日与宇宙 · 知识"],["kc-kb-ec6-study-20261125-905-001-knowledge","905-001 视觉艺术 · 知识"],["kc-kb-ec6-study-20261125-905-002-knowledge","905-002 音乐 · 知识"],["kc-kb-ec6-study-20261125-905-003-knowledge","905-003 健康教育 · 知识"],["kc-kb-ec6-study-20261125-905-004-knowledge","905-004 体育与动作发展 · 知识"],["kc-kb-ec6-study-20261125-905-005-knowledge","905-005 戏剧 · 知识"]]},{"id":"kl-kb-ec6-study-20261125-skill","name":"技能与达成标准","cards":[["kc-kb-ec6-study-20261125-901-001-skill","901-001 口语与互动 · 技能"],["kc-kb-ec6-study-20261125-901-002-skill","901-002 词形分析与识词 · 技能"],["kc-kb-ec6-study-20261125-901-003-skill","901-003 阅读流畅度 · 技能"],["kc-kb-ec6-study-20261125-901-004-skill","901-004 理解与文学分析 · 技能"],["kc-kb-ec6-study-20261125-901-005-skill","901-005 词汇教学 · 技能"],["kc-kb-ec6-study-20261125-901-006-skill","901-006 探究与研究 · 技能"],["kc-kb-ec6-study-20261125-901-007-skill","901-007 书写规范 · 技能"],["kc-kb-ec6-study-20261125-901-008-skill","901-008 写作与交流 · 技能"],["kc-kb-ec6-study-20261125-901-009-skill","901-009 视觉与媒体素养 · 技能"],["kc-kb-ec6-study-20261125-901-010-skill","901-010 读写评估与干预 · 技能"],["kc-kb-ec6-study-20261125-902-001-skill","902-001 数学教学 · 技能"],["kc-kb-ec6-study-20261125-902-002-skill","902-002 数与运算 · 技能"],["kc-kb-ec6-study-20261125-902-003-skill","902-003 模式与代数 · 技能"],["kc-kb-ec6-study-20261125-902-004-skill","902-004 几何与测量 · 技能"],["kc-kb-ec6-study-20261125-902-005-skill","902-005 概率与统计 · 技能"],["kc-kb-ec6-study-20261125-902-006-skill","902-006 数学问题解决 · 技能"],["kc-kb-ec6-study-20261125-903-001-skill","903-001 社会科学探究教学 · 技能"],["kc-kb-ec6-study-20261125-903-002-skill","903-002 历史与变化 · 技能"],["kc-kb-ec6-study-20261125-903-003-skill","903-003 地理与文化 · 技能"],["kc-kb-ec6-study-20261125-903-004-skill","903-004 经济与选择 · 技能"],["kc-kb-ec6-study-20261125-903-005-skill","903-005 政府与公民 · 技能"],["kc-kb-ec6-study-20261125-904-001-skill","904-001 实验过程与安全 · 技能"],["kc-kb-ec6-study-20261125-904-002-skill","904-002 科学的本质与发展 · 技能"],["kc-kb-ec6-study-20261125-904-003-skill","904-003 科学技术与社会 · 技能"],["kc-kb-ec6-study-20261125-904-004-skill","904-004 系统、模型与跨学科概念 · 技能"],["kc-kb-ec6-study-20261125-904-005-skill","904-005 科学学习与教学 · 技能"],["kc-kb-ec6-study-20261125-904-006-skill","904-006 科学评估 · 技能"],["kc-kb-ec6-study-20261125-904-007-skill","904-007 力与运动 · 技能"],["kc-kb-ec6-study-20261125-904-008-skill","904-008 物质性质与变化 · 技能"],["kc-kb-ec6-study-20261125-904-009-skill","904-009 能量与相互作用 · 技能"],["kc-kb-ec6-study-20261125-904-010-skill","904-010 能量转化与守恒 · 技能"],["kc-kb-ec6-study-20261125-904-011-skill","904-011 生命结构与功能 · 技能"],["kc-kb-ec6-study-20261125-904-012-skill","904-012 繁殖与遗传 · 技能"],["kc-kb-ec6-study-20261125-904-013-skill","904-013 适应与演化 · 技能"],["kc-kb-ec6-study-20261125-904-014-skill","904-014 生物与环境 · 技能"],["kc-kb-ec6-study-20261125-904-015-skill","904-015 地球系统与地貌 · 技能"],["kc-kb-ec6-study-20261125-904-016-skill","904-016 地球中的循环 · 技能"],["kc-kb-ec6-study-20261125-904-017-skill","904-017 天气与气候 · 技能"],["kc-kb-ec6-study-20261125-904-018-skill","904-018 地月日与宇宙 · 技能"],["kc-kb-ec6-study-20261125-905-001-skill","905-001 视觉艺术 · 技能"],["kc-kb-ec6-study-20261125-905-002-skill","905-002 音乐 · 技能"],["kc-kb-ec6-study-20261125-905-003-skill","905-003 健康教育 · 技能"],["kc-kb-ec6-study-20261125-905-004-skill","905-004 体育与动作发展 · 技能"],["kc-kb-ec6-study-20261125-905-005-skill","905-005 戏剧 · 技能"]]},{"id":"kl-kb-ec6-study-20261125-anchor","name":"Anchor Chart 图解","cards":[["kc-kb-ec6-study-20261125-901-001-anchor","901-001 口语与互动 · 图解"],["kc-kb-ec6-study-20261125-901-002-anchor","901-002 词形分析与识词 · 图解"],["kc-kb-ec6-study-20261125-901-003-anchor","901-003 阅读流畅度 · 图解"],["kc-kb-ec6-study-20261125-901-004-anchor","901-004 理解与文学分析 · 图解"],["kc-kb-ec6-study-20261125-901-005-anchor","901-005 词汇教学 · 图解"],["kc-kb-ec6-study-20261125-901-006-anchor","901-006 探究与研究 · 图解"],["kc-kb-ec6-study-20261125-901-007-anchor","901-007 书写规范 · 图解"],["kc-kb-ec6-study-20261125-901-008-anchor","901-008 写作与交流 · 图解"],["kc-kb-ec6-study-20261125-901-009-anchor","901-009 视觉与媒体素养 · 图解"],["kc-kb-ec6-study-20261125-901-010-anchor","901-010 读写评估与干预 · 图解"],["kc-kb-ec6-study-20261125-902-001-anchor","902-001 数学教学 · 图解"],["kc-kb-ec6-study-20261125-902-002-anchor","902-002 数与运算 · 图解"],["kc-kb-ec6-study-20261125-902-003-anchor","902-003 模式与代数 · 图解"],["kc-kb-ec6-study-20261125-902-004-anchor","902-004 几何与测量 · 图解"],["kc-kb-ec6-study-20261125-902-005-anchor","902-005 概率与统计 · 图解"],["kc-kb-ec6-study-20261125-902-006-anchor","902-006 数学问题解决 · 图解"],["kc-kb-ec6-study-20261125-903-001-anchor","903-001 社会科学探究教学 · 图解"],["kc-kb-ec6-study-20261125-903-002-anchor","903-002 历史与变化 · 图解"],["kc-kb-ec6-study-20261125-903-003-anchor","903-003 地理与文化 · 图解"],["kc-kb-ec6-study-20261125-903-004-anchor","903-004 经济与选择 · 图解"],["kc-kb-ec6-study-20261125-903-005-anchor","903-005 政府与公民 · 图解"],["kc-kb-ec6-study-20261125-904-001-anchor","904-001 实验过程与安全 · 图解"],["kc-kb-ec6-study-20261125-904-002-anchor","904-002 科学的本质与发展 · 图解"],["kc-kb-ec6-study-20261125-904-003-anchor","904-003 科学技术与社会 · 图解"],["kc-kb-ec6-study-20261125-904-004-anchor","904-004 系统、模型与跨学科概念 · 图解"],["kc-kb-ec6-study-20261125-904-005-anchor","904-005 科学学习与教学 · 图解"],["kc-kb-ec6-study-20261125-904-006-anchor","904-006 科学评估 · 图解"],["kc-kb-ec6-study-20261125-904-007-anchor","904-007 力与运动 · 图解"],["kc-kb-ec6-study-20261125-904-008-anchor","904-008 物质性质与变化 · 图解"],["kc-kb-ec6-study-20261125-904-009-anchor","904-009 能量与相互作用 · 图解"],["kc-kb-ec6-study-20261125-904-010-anchor","904-010 能量转化与守恒 · 图解"],["kc-kb-ec6-study-20261125-904-011-anchor","904-011 生命结构与功能 · 图解"],["kc-kb-ec6-study-20261125-904-012-anchor","904-012 繁殖与遗传 · 图解"],["kc-kb-ec6-study-20261125-904-013-anchor","904-013 适应与演化 · 图解"],["kc-kb-ec6-study-20261125-904-014-anchor","904-014 生物与环境 · 图解"],["kc-kb-ec6-study-20261125-904-015-anchor","904-015 地球系统与地貌 · 图解"],["kc-kb-ec6-study-20261125-904-016-anchor","904-016 地球中的循环 · 图解"],["kc-kb-ec6-study-20261125-904-017-anchor","904-017 天气与气候 · 图解"],["kc-kb-ec6-study-20261125-904-018-anchor","904-018 地月日与宇宙 · 图解"],["kc-kb-ec6-study-20261125-905-001-anchor","905-001 视觉艺术 · 图解"],["kc-kb-ec6-study-20261125-905-002-anchor","905-002 音乐 · 图解"],["kc-kb-ec6-study-20261125-905-003-anchor","905-003 健康教育 · 图解"],["kc-kb-ec6-study-20261125-905-004-anchor","905-004 体育与动作发展 · 图解"],["kc-kb-ec6-study-20261125-905-005-anchor","905-005 戏剧 · 图解"]]},{"id":"kl-kb-ec6-study-20261125-case","name":"误区与应用自测","cards":[["kc-kb-ec6-study-20261125-901-001-case","901-001 口语与互动 · 自测"],["kc-kb-ec6-study-20261125-901-002-case","901-002 词形分析与识词 · 自测"],["kc-kb-ec6-study-20261125-901-003-case","901-003 阅读流畅度 · 自测"],["kc-kb-ec6-study-20261125-901-004-case","901-004 理解与文学分析 · 自测"],["kc-kb-ec6-study-20261125-901-005-case","901-005 词汇教学 · 自测"],["kc-kb-ec6-study-20261125-901-006-case","901-006 探究与研究 · 自测"],["kc-kb-ec6-study-20261125-901-007-case","901-007 书写规范 · 自测"],["kc-kb-ec6-study-20261125-901-008-case","901-008 写作与交流 · 自测"],["kc-kb-ec6-study-20261125-901-009-case","901-009 视觉与媒体素养 · 自测"],["kc-kb-ec6-study-20261125-901-010-case","901-010 读写评估与干预 · 自测"],["kc-kb-ec6-study-20261125-902-001-case","902-001 数学教学 · 自测"],["kc-kb-ec6-study-20261125-902-002-case","902-002 数与运算 · 自测"],["kc-kb-ec6-study-20261125-902-003-case","902-003 模式与代数 · 自测"],["kc-kb-ec6-study-20261125-902-004-case","902-004 几何与测量 · 自测"],["kc-kb-ec6-study-20261125-902-005-case","902-005 概率与统计 · 自测"],["kc-kb-ec6-study-20261125-902-006-case","902-006 数学问题解决 · 自测"],["kc-kb-ec6-study-20261125-903-001-case","903-001 社会科学探究教学 · 自测"],["kc-kb-ec6-study-20261125-903-002-case","903-002 历史与变化 · 自测"],["kc-kb-ec6-study-20261125-903-003-case","903-003 地理与文化 · 自测"],["kc-kb-ec6-study-20261125-903-004-case","903-004 经济与选择 · 自测"],["kc-kb-ec6-study-20261125-903-005-case","903-005 政府与公民 · 自测"],["kc-kb-ec6-study-20261125-904-001-case","904-001 实验过程与安全 · 自测"],["kc-kb-ec6-study-20261125-904-002-case","904-002 科学的本质与发展 · 自测"],["kc-kb-ec6-study-20261125-904-003-case","904-003 科学技术与社会 · 自测"],["kc-kb-ec6-study-20261125-904-004-case","904-004 系统、模型与跨学科概念 · 自测"],["kc-kb-ec6-study-20261125-904-005-case","904-005 科学学习与教学 · 自测"],["kc-kb-ec6-study-20261125-904-006-case","904-006 科学评估 · 自测"],["kc-kb-ec6-study-20261125-904-007-case","904-007 力与运动 · 自测"],["kc-kb-ec6-study-20261125-904-008-case","904-008 物质性质与变化 · 自测"],["kc-kb-ec6-study-20261125-904-009-case","904-009 能量与相互作用 · 自测"],["kc-kb-ec6-study-20261125-904-010-case","904-010 能量转化与守恒 · 自测"],["kc-kb-ec6-study-20261125-904-011-case","904-011 生命结构与功能 · 自测"],["kc-kb-ec6-study-20261125-904-012-case","904-012 繁殖与遗传 · 自测"],["kc-kb-ec6-study-20261125-904-013-case","904-013 适应与演化 · 自测"],["kc-kb-ec6-study-20261125-904-014-case","904-014 生物与环境 · 自测"],["kc-kb-ec6-study-20261125-904-015-case","904-015 地球系统与地貌 · 自测"],["kc-kb-ec6-study-20261125-904-016-case","904-016 地球中的循环 · 自测"],["kc-kb-ec6-study-20261125-904-017-case","904-017 天气与气候 · 自测"],["kc-kb-ec6-study-20261125-904-018-case","904-018 地月日与宇宙 · 自测"],["kc-kb-ec6-study-20261125-905-001-case","905-001 视觉艺术 · 自测"],["kc-kb-ec6-study-20261125-905-002-case","905-002 音乐 · 自测"],["kc-kb-ec6-study-20261125-905-003-case","905-003 健康教育 · 自测"],["kc-kb-ec6-study-20261125-905-004-case","905-004 体育与动作发展 · 自测"],["kc-kb-ec6-study-20261125-905-005-case","905-005 戏剧 · 自测"]]},{"id":"kl-kb-ec6-study-20261125-term","name":"核心术语","cards":[["kc-kb-ec6-study-20261125-901-001-t1","phonology · 音系"],["kc-kb-ec6-study-20261125-901-001-t2","syntax · 句法"],["kc-kb-ec6-study-20261125-901-001-t3","pragmatics · 语用"],["kc-kb-ec6-study-20261125-901-001-t4","semantics · 语义"],["kc-kb-ec6-study-20261125-901-002-t1","phoneme · 音素"],["kc-kb-ec6-study-20261125-901-002-t2","grapheme · 字素"],["kc-kb-ec6-study-20261125-901-002-t3","morpheme · 语素"],["kc-kb-ec6-study-20261125-901-002-t4","structural analysis · 构词分析"],["kc-kb-ec6-study-20261125-901-002-t5","homophone · 同音异义词"],["kc-kb-ec6-study-20261125-901-003-t1","fluency · 流畅度"],["kc-kb-ec6-study-20261125-901-003-t2","prosody · 韵律"],["kc-kb-ec6-study-20261125-901-003-t3","automaticity · 自动化"],["kc-kb-ec6-study-20261125-901-003-t4","WCPM · 每分钟正确词数"],["kc-kb-ec6-study-20261125-901-004-t1","inference · 推断"],["kc-kb-ec6-study-20261125-901-004-t2","theme · 主题"],["kc-kb-ec6-study-20261125-901-004-t3","main idea · 主旨"],["kc-kb-ec6-study-20261125-901-004-t4","metacognition · 元认知"],["kc-kb-ec6-study-20261125-901-005-t1","Tier 2 vocabulary · 通用学术词"],["kc-kb-ec6-study-20261125-901-005-t2","Tier 3 vocabulary · 学科专用词"],["kc-kb-ec6-study-20261125-901-005-t3","semantic map · 语义图"],["kc-kb-ec6-study-20261125-901-005-t4","context clue · 语境线索"],["kc-kb-ec6-study-20261125-901-006-t1","primary source · 一手资料"],["kc-kb-ec6-study-20261125-901-006-t2","secondary source · 二手资料"],["kc-kb-ec6-study-20261125-901-006-t3","paraphrase · 释义转述"],["kc-kb-ec6-study-20261125-901-006-t4","corroboration · 相互印证"],["kc-kb-ec6-study-20261125-901-007-t1","convention · 书写规范"],["kc-kb-ec6-study-20261125-901-007-t2","subject–verb agreement · 主谓一致"],["kc-kb-ec6-study-20261125-901-007-t3","editing · 编辑校订"],["kc-kb-ec6-study-20261125-901-008-t1","revision · 修订"],["kc-kb-ec6-study-20261125-901-008-t2","audience · 读者或听众"],["kc-kb-ec6-study-20261125-901-008-t3","writing process · 写作过程"],["kc-kb-ec6-study-20261125-901-009-t1","media literacy · 媒体素养"],["kc-kb-ec6-study-20261125-901-009-t2","visual representation · 视觉表征"],["kc-kb-ec6-study-20261125-901-009-t3","bias · 偏向"],["kc-kb-ec6-study-20261125-901-010-t1","formative assessment · 形成性评估"],["kc-kb-ec6-study-20261125-901-010-t2","summative assessment · 总结性评估"],["kc-kb-ec6-study-20261125-901-010-t3","criterion-referenced · 标准参照"],["kc-kb-ec6-study-20261125-901-010-t4","norm-referenced · 常模参照"],["kc-kb-ec6-study-20261125-902-001-t1","representation · 表征"],["kc-kb-ec6-study-20261125-902-001-t2","manipulative · 数学操作物"],["kc-kb-ec6-study-20261125-902-001-t3","mathematical discourse · 数学讨论"],["kc-kb-ec6-study-20261125-902-002-t1","unit fraction · 单位分数"],["kc-kb-ec6-study-20261125-902-002-t2","equivalent fractions · 等值分数"],["kc-kb-ec6-study-20261125-902-002-t3","place value · 位值"],["kc-kb-ec6-study-20261125-902-002-t4","GCF · 最大公因数"],["kc-kb-ec6-study-20261125-902-002-t5","LCM · 最小公倍数"],["kc-kb-ec6-study-20261125-902-002-t6","ratio · 比"],["kc-kb-ec6-study-20261125-902-002-t7","percent · 百分率"],["kc-kb-ec6-study-20261125-902-003-t1","variable · 变量"],["kc-kb-ec6-study-20261125-902-003-t2","expression · 表达式"],["kc-kb-ec6-study-20261125-902-003-t3","equation · 方程"],["kc-kb-ec6-study-20261125-902-003-t4","linear function · 线性函数"],["kc-kb-ec6-study-20261125-902-003-t5","proportional relationship · 正比例关系"],["kc-kb-ec6-study-20261125-902-004-t1","perimeter · 周长"],["kc-kb-ec6-study-20261125-902-004-t2","area · 面积"],["kc-kb-ec6-study-20261125-902-004-t3","volume · 体积"],["kc-kb-ec6-study-20261125-902-004-t4","congruence · 全等"],["kc-kb-ec6-study-20261125-902-004-t5","similarity · 相似"],["kc-kb-ec6-study-20261125-902-005-t1","mean · 均值"],["kc-kb-ec6-study-20261125-902-005-t2","median · 中位数"],["kc-kb-ec6-study-20261125-902-005-t3","range · 极差"],["kc-kb-ec6-study-20261125-902-005-t4","sample bias · 样本偏差"],["kc-kb-ec6-study-20261125-902-005-t5","experimental probability · 实验概率"],["kc-kb-ec6-study-20261125-902-006-t1","mathematical model · 数学模型"],["kc-kb-ec6-study-20261125-902-006-t2","reasonableness · 合理性"],["kc-kb-ec6-study-20261125-902-006-t3","justification · 论证理由"],["kc-kb-ec6-study-20261125-903-001-t1","inquiry · 探究"],["kc-kb-ec6-study-20261125-903-001-t2","evidence · 证据"],["kc-kb-ec6-study-20261125-903-001-t3","perspective · 视角"],["kc-kb-ec6-study-20261125-903-002-t1","chronology · 年代顺序"],["kc-kb-ec6-study-20261125-903-002-t2","causation · 因果关系"],["kc-kb-ec6-study-20261125-903-002-t3","Reconstruction · 重建时期"],["kc-kb-ec6-study-20261125-903-002-t4","annexation · 并入"],["kc-kb-ec6-study-20261125-903-002-t5","continuity and change · 延续与变化"],["kc-kb-ec6-study-20261125-903-003-t1","latitude · 纬度"],["kc-kb-ec6-study-20261125-903-003-t2","longitude · 经度"],["kc-kb-ec6-study-20261125-903-003-t3","map scale · 地图比例尺"],["kc-kb-ec6-study-20261125-903-003-t4","cultural diffusion · 文化扩散"],["kc-kb-ec6-study-20261125-903-003-t5","human–environment interaction · 人地互动"],["kc-kb-ec6-study-20261125-903-004-t1","scarcity · 稀缺"],["kc-kb-ec6-study-20261125-903-004-t2","opportunity cost · 机会成本"],["kc-kb-ec6-study-20261125-903-004-t3","incentive · 激励"],["kc-kb-ec6-study-20261125-903-004-t4","supply · 供给"],["kc-kb-ec6-study-20261125-903-004-t5","demand · 需求"],["kc-kb-ec6-study-20261125-903-005-t1","separation of powers · 分权"],["kc-kb-ec6-study-20261125-903-005-t2","checks and balances · 制衡"],["kc-kb-ec6-study-20261125-903-005-t3","federalism · 联邦制"],["kc-kb-ec6-study-20261125-903-005-t4","popular sovereignty · 人民主权"],["kc-kb-ec6-study-20261125-903-005-t5","civic responsibility · 公民责任"],["kc-kb-ec6-study-20261125-904-001-t1","precision · 精密性"],["kc-kb-ec6-study-20261125-904-001-t2","accuracy · 准确性"],["kc-kb-ec6-study-20261125-904-001-t3","controlled variable · 控制变量"],["kc-kb-ec6-study-20261125-904-002-t1","hypothesis · 假设"],["kc-kb-ec6-study-20261125-904-002-t2","scientific theory · 科学理论"],["kc-kb-ec6-study-20261125-904-002-t3","scientific law · 科学定律"],["kc-kb-ec6-study-20261125-904-003-t1","renewable resource · 可再生资源"],["kc-kb-ec6-study-20261125-904-003-t2","nonrenewable resource · 不可再生资源"],["kc-kb-ec6-study-20261125-904-003-t3","trade-off · 权衡取舍"],["kc-kb-ec6-study-20261125-904-004-t1","system · 系统"],["kc-kb-ec6-study-20261125-904-004-t2","model · 模型"],["kc-kb-ec6-study-20261125-904-004-t3","structure and function · 结构与功能"],["kc-kb-ec6-study-20261125-904-005-t1","prior knowledge · 先前知识"],["kc-kb-ec6-study-20261125-904-005-t2","scaffolding · 支架"],["kc-kb-ec6-study-20261125-904-005-t3","conceptual change · 概念转变"],["kc-kb-ec6-study-20261125-904-006-t1","rubric · 量规"],["kc-kb-ec6-study-20261125-904-006-t2","performance assessment · 表现性评估"],["kc-kb-ec6-study-20261125-904-006-t3","feedback · 反馈"],["kc-kb-ec6-study-20261125-904-007-t1","net force · 合力"],["kc-kb-ec6-study-20261125-904-007-t2","speed · 速率"],["kc-kb-ec6-study-20261125-904-007-t3","velocity · 速度"],["kc-kb-ec6-study-20261125-904-007-t4","friction · 摩擦力"],["kc-kb-ec6-study-20261125-904-008-t1","density · 密度"],["kc-kb-ec6-study-20261125-904-008-t2","physical change · 物理变化"],["kc-kb-ec6-study-20261125-904-008-t3","chemical change · 化学变化"],["kc-kb-ec6-study-20261125-904-008-t4","mixture · 混合物"],["kc-kb-ec6-study-20261125-904-008-t5","solution · 溶液"],["kc-kb-ec6-study-20261125-904-009-t1","conduction · 传导"],["kc-kb-ec6-study-20261125-904-009-t2","convection · 对流"],["kc-kb-ec6-study-20261125-904-009-t3","radiation · 辐射"],["kc-kb-ec6-study-20261125-904-009-t4","refraction · 折射"],["kc-kb-ec6-study-20261125-904-009-t5","closed circuit · 闭合电路"],["kc-kb-ec6-study-20261125-904-010-t1","energy transfer · 能量转移"],["kc-kb-ec6-study-20261125-904-010-t2","energy transformation · 能量转化"],["kc-kb-ec6-study-20261125-904-010-t3","conservation · 守恒"],["kc-kb-ec6-study-20261125-904-011-t1","cell · 细胞"],["kc-kb-ec6-study-20261125-904-011-t2","organ system · 器官系统"],["kc-kb-ec6-study-20261125-904-011-t3","metamorphosis · 变态发育"],["kc-kb-ec6-study-20261125-904-011-t4","homeostasis · 稳态"],["kc-kb-ec6-study-20261125-904-012-t1","genotype · 基因型"],["kc-kb-ec6-study-20261125-904-012-t2","phenotype · 表现型"],["kc-kb-ec6-study-20261125-904-012-t3","allele · 等位基因"],["kc-kb-ec6-study-20261125-904-012-t4","dominant · 显性"],["kc-kb-ec6-study-20261125-904-013-t1","adaptation · 适应性特征"],["kc-kb-ec6-study-20261125-904-013-t2","natural selection · 自然选择"],["kc-kb-ec6-study-20261125-904-013-t3","mutation · 突变"],["kc-kb-ec6-study-20261125-904-013-t4","selective breeding · 人工选择"],["kc-kb-ec6-study-20261125-904-014-t1","producer · 生产者"],["kc-kb-ec6-study-20261125-904-014-t2","decomposer · 分解者"],["kc-kb-ec6-study-20261125-904-014-t3","niche · 生态位"],["kc-kb-ec6-study-20261125-904-014-t4","population · 种群"],["kc-kb-ec6-study-20261125-904-014-t5","carrying capacity · 环境容纳量"],["kc-kb-ec6-study-20261125-904-015-t1","weathering · 风化"],["kc-kb-ec6-study-20261125-904-015-t2","erosion · 侵蚀"],["kc-kb-ec6-study-20261125-904-015-t3","deposition · 沉积"],["kc-kb-ec6-study-20261125-904-015-t4","groundwater · 地下水"],["kc-kb-ec6-study-20261125-904-016-t1","evaporation · 蒸发"],["kc-kb-ec6-study-20261125-904-016-t2","condensation · 凝结"],["kc-kb-ec6-study-20261125-904-016-t3","transpiration · 蒸腾"],["kc-kb-ec6-study-20261125-904-016-t4","rock cycle · 岩石循环"],["kc-kb-ec6-study-20261125-904-017-t1","weather · 天气"],["kc-kb-ec6-study-20261125-904-017-t2","climate · 气候"],["kc-kb-ec6-study-20261125-904-017-t3","humidity · 湿度"],["kc-kb-ec6-study-20261125-904-017-t4","air pressure · 气压"],["kc-kb-ec6-study-20261125-904-018-t1","rotation · 自转"],["kc-kb-ec6-study-20261125-904-018-t2","revolution · 公转"],["kc-kb-ec6-study-20261125-904-018-t3","lunar phase · 月相"],["kc-kb-ec6-study-20261125-904-018-t4","axial tilt · 地轴倾斜"],["kc-kb-ec6-study-20261125-904-018-t5","eclipse · 食"],["kc-kb-ec6-study-20261125-905-001-t1","value · 明暗"],["kc-kb-ec6-study-20261125-905-001-t2","texture · 肌理"],["kc-kb-ec6-study-20261125-905-001-t3","contrast · 对比"],["kc-kb-ec6-study-20261125-905-001-t4","balance · 平衡"],["kc-kb-ec6-study-20261125-905-002-t1","tempo · 速度"],["kc-kb-ec6-study-20261125-905-002-t2","dynamics · 力度"],["kc-kb-ec6-study-20261125-905-002-t3","timbre · 音色"],["kc-kb-ec6-study-20261125-905-002-t4","rhythm · 节奏"],["kc-kb-ec6-study-20261125-905-002-t5","meter · 节拍组织"],["kc-kb-ec6-study-20261125-905-003-t1","health literacy · 健康素养"],["kc-kb-ec6-study-20261125-905-003-t2","risk factor · 风险因素"],["kc-kb-ec6-study-20261125-905-003-t3","refusal skill · 拒绝技能"],["kc-kb-ec6-study-20261125-905-004-t1","locomotor skill · 位移动作"],["kc-kb-ec6-study-20261125-905-004-t2","nonlocomotor skill · 非位移动作"],["kc-kb-ec6-study-20261125-905-004-t3","manipulative skill · 操控动作"],["kc-kb-ec6-study-20261125-905-004-t4","FITT · 运动计划要素"],["kc-kb-ec6-study-20261125-905-005-t1","improvisation · 即兴表演"],["kc-kb-ec6-study-20261125-905-005-t2","pantomime · 哑剧"],["kc-kb-ec6-study-20261125-905-005-t3","conflict · 冲突"],["kc-kb-ec6-study-20261125-905-005-t4","stage direction · 舞台指示"]]},{"id":"kl-kb-ec6-study-20261125-resource","name":"资源与使用任务","cards":[["kc-kb-ec6-study-20261125-resource-framework","391 官方考试框架"],["kc-kb-ec6-study-20261125-resource-prep","391 官方备考入口与可打印手册"],["kc-kb-ec6-study-20261125-resource-exam-details","391 官方考试详情"],["kc-kb-ec6-study-20261125-resource-official-901","语言与读写：官方样题与解释"],["kc-kb-ec6-study-20261125-resource-official-902","数学：官方样题与解释"],["kc-kb-ec6-study-20261125-resource-official-903","社会研究：官方样题与解释"],["kc-kb-ec6-study-20261125-resource-official-904","科学：官方样题与解释"],["kc-kb-ec6-study-20261125-resource-official-905","艺术·健康·体育：官方样题与解释"],["kc-kb-ec6-study-20261125-resource-teks","TEKS 现行课程标准总入口"],["kc-kb-ec6-study-20261125-resource-teks-110","TEKS 读写 Chapter 110"],["kc-kb-ec6-study-20261125-resource-teks-111","TEKS 数学 Chapter 111"],["kc-kb-ec6-study-20261125-resource-teks-112","TEKS 科学 Chapter 112"],["kc-kb-ec6-study-20261125-resource-teks-113","TEKS 社会研究 Chapter 113"],["kc-kb-ec6-study-20261125-resource-teks-115","TEKS 健康 Chapter 115"],["kc-kb-ec6-study-20261125-resource-teks-116","TEKS 体育 Chapter 116"],["kc-kb-ec6-study-20261125-resource-teks-finearts","TEKS 艺术 Chapter 117"],["kc-kb-ec6-study-20261125-resource-wwc-el","IES / WWC：英语学习者的学术内容与读写教学"],["kc-kb-ec6-study-20261125-resource-loc","Library of Congress：一手资料分析工具"],["kc-kb-ec6-study-20261125-resource-archives","National Archives：建国文献"],["kc-kb-ec6-study-20261125-resource-texas-history","Texas State Library：Texas 历史史料目录"],["kc-kb-ec6-study-20261125-resource-dallasfed","Dallas Fed：Everyday Economics"],["kc-kb-ec6-study-20261125-resource-phet-fraction","PhET：Build a Fraction"],["kc-kb-ec6-study-20261125-resource-phet-energy","PhET：Energy Forms and Changes"],["kc-kb-ec6-study-20261125-resource-nasa-moon","NASA JPL：Observing the Moon"],["kc-kb-ec6-study-20261125-resource-folkways","Smithsonian Folkways：音乐学习与教案"],["kc-kb-ec6-study-20261125-resource-cdc-pe","CDC：学校与身体活动"],["kc-kb-ec6-study-20261125-resource-cdc-health","CDC：营养与身体活动的学校策略"]]},{"id":"kl-kb-ec6-study-20261125-history","name":"历史事件与因果","cards":[["kc-kb-ec6-study-20261125-history-1","1776 · 美国独立宣言"],["kc-kb-ec6-study-20261125-history-2","1787 · 美国宪法制定并签署"],["kc-kb-ec6-study-20261125-history-3","1791 · 权利法案获批准"],["kc-kb-ec6-study-20261125-history-4","1836 · Texas 宣布独立"],["kc-kb-ec6-study-20261125-history-5","1845 · Texas 加入美国"],["kc-kb-ec6-study-20261125-history-6","1861 · 美国内战开始"],["kc-kb-ec6-study-20261125-history-7","1865 · 美国内战结束；重建的关键起点"],["kc-kb-ec6-study-20261125-history-8","1870 · 第十五修正案获批准"]]}]},{"id":"board-ec6-glossary","title":"EC6 Glossary","icon":"character.book.closed.fill","color":"#8B5CF6","lists":[{"id":"col-ec6-901","name":"901 英语语言艺术与阅读 · English Language Arts and Reading","cards":[["EC6-T-001","语音 · phonology"],["EC6-T-002","语义 · semantics"],["EC6-T-003","句法 · syntax"],["EC6-T-004","语用 · pragmatics"],["EC6-T-005","主动倾听 · active listening"],["EC6-T-006","英语学习者 · English learners"],["EC6-T-007","句子支架 · sentence stems"],["EC6-T-008","字母拼读原则 · alphabetic principle"],["EC6-T-009","自然拼读 · phonics"],["EC6-T-010","六种音节类型 · syllable types"],["EC6-T-011","二合字母 · digraphs"],["EC6-T-012","构词法 · morphology"],["EC6-T-013","高频词 · high-frequency words"],["EC6-T-014","可解码文本 · decodable text"],["EC6-T-015","准确 · accuracy"],["EC6-T-016","速度 · rate"],["EC6-T-017","语调韵律 · prosody"],["EC6-T-018","每分钟正确词数 · words correct per minute"],["EC6-T-019","重复朗读 · repeated reading"],["EC6-T-020","读者剧场 · readers theatre"],["EC6-T-021","字面理解 · literal"],["EC6-T-022","推断理解 · inferential"],["EC6-T-023","评价理解 · evaluative"],["EC6-T-024","元认知 · metacognition"],["EC6-T-025","概括 · summarizing"],["EC6-T-026","文本结构 · text structure"],["EC6-T-027","体裁 · genre"],["EC6-T-028","二级学术词 · Tier 2 words"],["EC6-T-029","三级学科词 · Tier 3 words"],["EC6-T-030","上下文线索 · context clues"],["EC6-T-031","词根词缀 · roots and affixes"],["EC6-T-032","词汇图 · word maps"],["EC6-T-033","语义梯度 · semantic gradient"],["EC6-T-034","研究问题 · research question"],["EC6-T-035","一手资料 · primary source"],["EC6-T-036","二手资料 · secondary source"],["EC6-T-037","可信度 · credibility"],["EC6-T-038","做笔记 · note-taking"],["EC6-T-039","综合 · synthesis"],["EC6-T-040","自创拼写 · invented spelling"],["EC6-T-041","拼写规律 · spelling patterns"],["EC6-T-042","字母书写 · letter formation"],["EC6-T-043","握笔 · pencil grip"],["EC6-T-044","大写 · capitalization"],["EC6-T-045","标点 · punctuation"],["EC6-T-046","写作过程 · writing process"],["EC6-T-047","修改 · revising"],["EC6-T-048","编辑 · editing"],["EC6-T-049","读者对象 · audience"],["EC6-T-050","写作目的 · purpose"],["EC6-T-051","抄袭 · plagiarism"],["EC6-T-052","媒介素养 · media literacy"],["EC6-T-053","视觉元素 · visual elements"],["EC6-T-054","说服技巧 · persuasive techniques"],["EC6-T-055","多媒体 · multimedia"],["EC6-T-056","视角 · point of view"],["EC6-T-057","形成性评估 · formative assessment"],["EC6-T-058","总结性评估 · summative assessment"],["EC6-T-059","阅读记录 · running record"],["EC6-T-060","误读分析 · miscue analysis"],["EC6-T-061","教学水平 · instructional level"],["EC6-T-062","干预 · intervention"]]},{"id":"col-ec6-902","name":"902 数学 · Mathematics","cards":[["EC6-T-063","具体-图像-抽象 · concrete-representational-abstract"],["EC6-T-064","操作教具 · manipulatives"],["EC6-T-065","数学讨论 · math discourse"],["EC6-T-066","错误概念 · misconceptions"],["EC6-T-067","位值 · place value"],["EC6-T-068","分数 · fractions"],["EC6-T-069","小数 · decimals"],["EC6-T-070","百分数 · percent"],["EC6-T-071","估算 · estimation"],["EC6-T-072","质数 · prime numbers"],["EC6-T-073","数轴 · number line"],["EC6-T-074","规律 · patterns"],["EC6-T-075","函数 · function"],["EC6-T-076","线性关系 · linear relationship"],["EC6-T-077","变化率 · rate of change"],["EC6-T-078","比例推理 · proportional reasoning"],["EC6-T-079","方程 · equation"],["EC6-T-080","周长 · perimeter"],["EC6-T-081","面积 · area"],["EC6-T-082","体积 · volume"],["EC6-T-083","图形变换 · transformations"],["EC6-T-084","对称 · symmetry"],["EC6-T-085","单位换算 · unit conversion"],["EC6-T-086","坐标平面 · coordinate plane"],["EC6-T-087","平均数 · mean"],["EC6-T-088","中位数 · median"],["EC6-T-089","众数 · mode"],["EC6-T-090","极差 · range"],["EC6-T-091","样本空间 · sample space"],["EC6-T-092","复合概率 · compound probability"],["EC6-T-093","归纳推理 · inductive reasoning"],["EC6-T-094","演绎推理 · deductive reasoning"],["EC6-T-095","合理性 · reasonableness"],["EC6-T-096","多种表示 · representations"],["EC6-T-097","理财素养 · financial literacy"],["EC6-T-098","问题解决 · problem solving"]]},{"id":"col-ec6-903","name":"903 社会研究 · Social Studies","cards":[["EC6-T-099","得州基础知识与技能标准 · TEKS"],["EC6-T-100","纵向衔接 · vertical alignment"],["EC6-T-101","一手史料 · primary sources"],["EC6-T-102","模拟活动 · simulations"],["EC6-T-103","地图技能 · map skills"],["EC6-T-104","公民身份 · citizenship"],["EC6-T-105","时间顺序 · chronology"],["EC6-T-106","得州革命 · Texas Revolution"],["EC6-T-107","重建时期 · Reconstruction"],["EC6-T-108","民权运动 · civil rights movement"],["EC6-T-109","因果关系 · cause and effect"],["EC6-T-110","历史资料 · historical sources"],["EC6-T-111","地理五大主题 · five themes of geography"],["EC6-T-112","经纬度 · latitude and longitude"],["EC6-T-113","得州地理区域 · regions of Texas"],["EC6-T-114","人地互动 · human-environment interaction"],["EC6-T-115","迁移 · migration"],["EC6-T-116","文化 · culture"],["EC6-T-117","稀缺 · scarcity"],["EC6-T-118","机会成本 · opportunity cost"],["EC6-T-119","自由企业 · free enterprise"],["EC6-T-120","供给与需求 · supply and demand"],["EC6-T-121","国内生产总值 · GDP"],["EC6-T-122","贸易 · trade"],["EC6-T-123","美国宪法 · Constitution"],["EC6-T-124","权利法案 · Bill of Rights"],["EC6-T-125","分权制衡 · checks and balances"],["EC6-T-126","联邦制 · federalism"],["EC6-T-127","得州宪法 · Texas Constitution"],["EC6-T-128","公民责任 · civic responsibility"]]},{"id":"col-ec6-904","name":"904 科学 · Science","cards":[["EC6-T-129","实验安全 · lab safety"],["EC6-T-130","护目镜 · goggles"],["EC6-T-131","公制 · metric system"],["EC6-T-132","精度 · precision"],["EC6-T-133","测量误差 · measurement error"],["EC6-T-134","量筒 · graduated cylinder"],["EC6-T-135","探究 · inquiry"],["EC6-T-136","假设 · hypothesis"],["EC6-T-137","变量 · variables"],["EC6-T-138","公平测试 · fair test"],["EC6-T-139","证据 · evidence"],["EC6-T-140","同行评议 · peer review"],["EC6-T-141","可再生资源 · renewable resources"],["EC6-T-142","不可再生资源 · nonrenewable resources"],["EC6-T-143","保护 · conservation"],["EC6-T-144","风险与收益 · risk and benefit"],["EC6-T-145","污染 · pollution"],["EC6-T-146","伦理 · ethics"],["EC6-T-147","系统 · systems"],["EC6-T-148","模型 · models"],["EC6-T-149","形态与功能 · form and function"],["EC6-T-150","变化与恒定 · change and constancy"],["EC6-T-151","预测 · prediction"],["EC6-T-152","已有知识 · prior knowledge"],["EC6-T-153","5E 教学模式 · 5E model"],["EC6-T-154","动手学习 · hands-on learning"],["EC6-T-155","差异化教学 · differentiation"],["EC6-T-156","提问 · questioning"],["EC6-T-157","对齐 · alignment"],["EC6-T-158","表现性评估 · performance assessment"],["EC6-T-159","评分量规 · rubric"],["EC6-T-160","实验日志 · lab journal"],["EC6-T-161","观察 · observation"],["EC6-T-162","反馈 · feedback"],["EC6-T-163","重力 · gravity"],["EC6-T-164","摩擦力 · friction"],["EC6-T-165","磁力 · magnetism"],["EC6-T-166","速度 · speed"],["EC6-T-167","牛顿定律 · Newton’s laws"],["EC6-T-168","简单机械 · simple machines"],["EC6-T-169","平衡力 · balanced forces"],["EC6-T-170","物质三态 · states of matter"],["EC6-T-171","密度 · density"],["EC6-T-172","物理变化 · physical change"],["EC6-T-173","化学变化 · chemical change"],["EC6-T-174","原子 · atom"],["EC6-T-175","混合物 · mixtures"],["EC6-T-176","溶液 · solutions"],["EC6-T-177","能量守恒 · conservation of energy"],["EC6-T-178","传导 · conduction"],["EC6-T-179","对流 · convection"],["EC6-T-180","辐射 · radiation"],["EC6-T-181","电路 · circuits"],["EC6-T-182","反射 · reflection"],["EC6-T-183","折射 · refraction"],["EC6-T-184","能量转化 · energy transformation"],["EC6-T-185","光合作用 · photosynthesis"],["EC6-T-186","食物网 · food web"],["EC6-T-187","电能 · electricity"],["EC6-T-188","太阳能 · solar energy"],["EC6-T-189","物质守恒 · conservation of matter"],["EC6-T-190","细胞 · cells"],["EC6-T-191","器官系统 · organ systems"],["EC6-T-192","生命周期 · life cycle"],["EC6-T-193","变态发育 · metamorphosis"],["EC6-T-194","分类 · classification"],["EC6-T-195","基本需要 · basic needs"],["EC6-T-196","遗传性状 · inherited traits"],["EC6-T-197","习得行为 · learned behaviors"],["EC6-T-198","基因 · genes"],["EC6-T-199","显性 · dominant"],["EC6-T-200","隐性 · recessive"],["EC6-T-201","庞氏方格 · Punnett square"],["EC6-T-202","适应 · adaptation"],["EC6-T-203","伪装 · camouflage"],["EC6-T-204","自然选择 · natural selection"],["EC6-T-205","选择育种 · selective breeding"],["EC6-T-206","突变 · mutation"],["EC6-T-207","变异 · variation"],["EC6-T-208","刺激与反应 · stimulus and response"],["EC6-T-209","生产者 · producers"],["EC6-T-210","消费者 · consumers"],["EC6-T-211","分解者 · decomposers"],["EC6-T-212","食物链 · food chain"],["EC6-T-213","生态系统 · ecosystem"],["EC6-T-214","生态位 · niche"],["EC6-T-215","地壳、地幔、地核 · crust, mantle and core"],["EC6-T-216","板块构造 · plate tectonics"],["EC6-T-217","风化 · weathering"],["EC6-T-218","侵蚀 · erosion"],["EC6-T-219","沉积 · deposition"],["EC6-T-220","地下水 · groundwater"],["EC6-T-221","大气 · atmosphere"],["EC6-T-222","岩石循环 · rock cycle"],["EC6-T-223","火成岩 · igneous"],["EC6-T-224","沉积岩 · sedimentary"],["EC6-T-225","变质岩 · metamorphic"],["EC6-T-226","水循环 · water cycle"],["EC6-T-227","蒸发 · evaporation"],["EC6-T-228","凝结 · condensation"],["EC6-T-229","天气 · weather"],["EC6-T-230","气候 · climate"],["EC6-T-231","气压 · air pressure"],["EC6-T-232","湿度 · humidity"],["EC6-T-233","锋面 · fronts"],["EC6-T-234","气压计 · barometer"],["EC6-T-235","纬度 · latitude"],["EC6-T-236","自转 · rotation"],["EC6-T-237","公转 · revolution"],["EC6-T-238","地轴倾斜 · axial tilt"],["EC6-T-239","四季 · seasons"],["EC6-T-240","月相 · moon phases"],["EC6-T-241","日食月食 · eclipse"],["EC6-T-242","行星 · planets"]]},{"id":"col-ec6-905","name":"905 艺术、健康与体育 · Fine Arts, Health and Physical Education","cards":[["EC6-T-243","艺术元素 · elements of art"],["EC6-T-244","设计原则 · principles of design"],["EC6-T-245","色环 · color wheel"],["EC6-T-246","媒材 · media"],["EC6-T-247","艺术评析 · art criticism"],["EC6-T-248","文化遗产 · cultural heritage"],["EC6-T-249","节奏 · rhythm"],["EC6-T-250","音高 · pitch"],["EC6-T-251","速度 · tempo"],["EC6-T-252","力度 · dynamics"],["EC6-T-253","音色 · timbre"],["EC6-T-254","曲式 · form"],["EC6-T-255","五线谱 · staff notation"],["EC6-T-256","营养 · nutrition"],["EC6-T-257","疾病预防 · disease prevention"],["EC6-T-258","压力管理 · stress management"],["EC6-T-259","拒绝技巧 · refusal skills"],["EC6-T-260","急救 · first aid"],["EC6-T-261","决策 · decision-making"],["EC6-T-262","位移动作 · locomotor skills"],["EC6-T-263","操控动作 · manipulative skills"],["EC6-T-264","健康体能 · health-related fitness"],["EC6-T-265","FITT 原则 · FITT principle"],["EC6-T-266","体育精神 · sportsmanship"],["EC6-T-267","调整活动 · adapted activities"],["EC6-T-268","戏剧游戏 · dramatic play"],["EC6-T-269","哑剧 · pantomime"],["EC6-T-270","即兴 · improvisation"],["EC6-T-271","角色 · character"],["EC6-T-272","情节 · plot"],["EC6-T-273","舞台技术 · technical theatre"],["EC6-T-274","观众礼仪 · audience etiquette"]]}]}]
"""#
    public static func makeDefaultBoards() -> [WatchBoardModel] {
        guard let raw = defaultBoardsJSON.data(using: .utf8),
              let arr = try? JSONSerialization.jsonObject(with: raw) as? [[String: Any]] else { return [] }
        let icons = ["book.closed.fill", "checklist", "folder.fill"]
        return arr.map { b in
            let bid = b["id"] as? String ?? UUID().uuidString
            let lists = (b["lists"] as? [[String: Any]] ?? []).enumerated().map { (i, l) -> WatchListModel in
                let name = l["name"] as? String ?? "列表"
                let cards = (l["cards"] as? [[String]] ?? []).compactMap { c -> WatchCardModel? in
                    guard c.count >= 2 else { return nil }
                    return WatchCardModel(id: c[0], title: c[1], category: name)
                }
                return WatchListModel(id: l["id"] as? String ?? UUID().uuidString, name: name, icon: icons[min(i, icons.count - 1)],
                                      colorHex: b["color"] as? String ?? "#22C55E", boardId: bid, cards: cards)
            }
            return WatchBoardModel(id: bid, title: b["title"] as? String ?? "看板", icon: b["icon"] as? String ?? "folder.fill",
                                   colorHex: b["color"] as? String ?? "#22C55E", lists: lists)
        }
    }
    
    // MARK: - Actions
    
    public func selectBoard(id: String) {
        guard boards.contains(where: { $0.id == id }) else { return }
        selectedBoardId = id
        UserDefaults.standard.set(id, forKey: selectedBoardKey)
        if let firstList = currentBoard?.lists.first {
            selectedListId = firstList.id
            UserDefaults.standard.set(firstList.id, forKey: selectedListKey)
        }
        saveLocalCache()
        WKInterfaceDevice.current().play(.click)
        
        sendToPhone(message: [
            "action": "selectBoard",
            "boardId": id
        ])
    }
    
    public func selectList(id: String) {
        if !currentLists.contains(where: { $0.id == id }) {
            if let foundBoard = boards.first(where: { $0.lists.contains(where: { $0.id == id }) }) {
                selectedBoardId = foundBoard.id
                UserDefaults.standard.set(foundBoard.id, forKey: selectedBoardKey)
            }
        }
        guard currentLists.contains(where: { $0.id == id }) else { return }
        selectedListId = id
        UserDefaults.standard.set(id, forKey: selectedListKey)
        saveLocalCache()
        WKInterfaceDevice.current().play(.click)
        
        sendToPhone(message: [
            "action": "selectList",
            "listId": id,
            "boardId": selectedBoardId
        ])
    }
    
    /// Toggle entire card completion (Apple Reminders style checkmark)
    public func toggleCard(cardId: String) {
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }) {
                    boards[bIdx].lists[lIdx].cards[cIdx].isCompleted.toggle()
                    let isDone = boards[bIdx].lists[lIdx].cards[cIdx].isCompleted
                    
                    // Update 3-Ring Activity State
                    if isDone {
                        recordCardCheck()
                        WKInterfaceDevice.current().play(.success)
                    } else {
                        WKInterfaceDevice.current().play(.click)
                    }
                    
                    saveLocalCache()
                    
                    sendToPhone(message: [
                        "action": "toggleCard",
                        "cardId": cardId,
                        "isDone": isDone
                    ])
                    return
                }
            }
        }
    }
    
    /// Record a card check towards Ring 2 (打勾闭环) and Ring 3 (目标闭环)
    public func recordCardCheck() {
        ringsState.checkCount += 1
        
        // Recalculate goal percent
        let total = currentBoard?.totalCardsCount ?? 1
        let completed = currentBoard?.completedCardsCount ?? 0
        ringsState.goalPercent = total > 0 ? Int(Double(completed) / Double(total) * 100.0) : 100
        
        checkBadgeUnlocks()
        saveLocalCache()
        
        sendToPhone(message: [
            "action": "updateActivityRings",
            "focusMinutes": ringsState.focusMinutes,
            "checkCount": ringsState.checkCount,
            "goalPercent": ringsState.goalPercent,
            "targetMinutes": ringsState.targetMinutes,
            "targetChecks": ringsState.targetChecks,
            "targetGoalPercent": ringsState.goalTarget
        ])
    }
    
    /// Add focus time towards Ring 1 (时长闭环)
    public func addFocusMinutes(_ mins: Int) {
        ringsState.focusMinutes += mins
        checkBadgeUnlocks()
        saveLocalCache()
    }
    
    /// Evaluate badge unlock criteria
    public func checkBadgeUnlocks() {
        // 31.6: badges unlock only after a claim on the iPhone (see wallUnlockedIds).
    }
    
    /// Toggle sub-checklist item inside a card
    public func toggleItem(cardId: String, itemId: String) {
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }),
                   let iIdx = boards[bIdx].lists[lIdx].cards[cIdx].items.firstIndex(where: { $0.id == itemId }) {
                    
                    boards[bIdx].lists[lIdx].cards[cIdx].items[iIdx].isDone.toggle()
                    let isDone = boards[bIdx].lists[lIdx].cards[cIdx].items[iIdx].isDone
                    
                    // If all sub-items done, also mark card complete
                    if boards[bIdx].lists[lIdx].cards[cIdx].items.allSatisfy({ $0.isDone }) {
                        boards[bIdx].lists[lIdx].cards[cIdx].isCompleted = true
                        WKInterfaceDevice.current().play(.success)
                    } else {
                        WKInterfaceDevice.current().play(.click)
                    }
                    
                    recordCardCheck()
                    saveLocalCache()
                    
                    sendToPhone(message: [
                        "action": "toggleCardItem",
                        "cardId": cardId,
                        "itemId": itemId,
                        "isDone": isDone
                    ])
                    return
                }
            }
        }
    }
    
    public func toggleItem(id: String) {
        if let card = currentCard {
            toggleItem(cardId: card.id, itemId: id)
        }
    }
    
    /// Add a new card at the bottom of the list (Apple Reminders style)
    public func addCard(title: String, listId: String? = nil) {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }
        
        let targetListId = listId ?? selectedListId
        let newCard = WatchCardModel(
            id: "card-\(UUID().uuidString.prefix(8))",
            title: trimmedTitle,
            isCompleted: false,
            category: currentList?.name ?? "卡片",
            hasChecklist: false,
            items: []
        )
        
        for bIdx in boards.indices {
            if let lIdx = boards[bIdx].lists.firstIndex(where: { $0.id == targetListId }) {
                boards[bIdx].lists[lIdx].cards.append(newCard)
                saveLocalCache()
                WKInterfaceDevice.current().play(.click)
                
                sendToPhone(message: [
                    "action": "addCard",
                    "boardId": boards[bIdx].id,
                    "listId": targetListId,
                    "id": newCard.id,
                    "title": trimmedTitle,
                    "category": boards[bIdx].lists[lIdx].name
                ])
                return
            }
        }
    }
    
    /// Add sub-item to card
    public func addChecklistItem(cardId: String, text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }) {
                    let newItem = WatchTaskItem(
                        id: "chk-\(UUID().uuidString.prefix(6))",
                        text: trimmed,
                        isDone: false
                    )
                    boards[bIdx].lists[lIdx].cards[cIdx].items.append(newItem)
                    boards[bIdx].lists[lIdx].cards[cIdx].hasChecklist = true
                    saveLocalCache()
                    WKInterfaceDevice.current().play(.click)
                    
                    sendToPhone(message: [
                        "action": "addCardItem",
                        "cardId": cardId,
                        "id": newItem.id,
                        "text": trimmed
                    ])
                    return
                }
            }
        }
    }
    
    public func deleteCard(cardId: String) {
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }) {
                    boards[bIdx].lists[lIdx].cards.remove(at: cIdx)
                    saveLocalCache()
                    WKInterfaceDevice.current().play(.directionDown)
                    return
                }
            }
        }
    }
    
    public func deleteChecklistItem(cardId: String, at offsets: IndexSet) {
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }) {
                    boards[bIdx].lists[lIdx].cards[cIdx].items.remove(atOffsets: offsets)
                    if boards[bIdx].lists[lIdx].cards[cIdx].items.isEmpty {
                        boards[bIdx].lists[lIdx].cards[cIdx].hasChecklist = false
                    }
                    saveLocalCache()
                    WKInterfaceDevice.current().play(.directionDown)
                    return
                }
            }
        }
    }
    
    public func updateCardItems(cardId: String, newItems: [WatchTaskItem]) {
        for bIdx in boards.indices {
            for lIdx in boards[bIdx].lists.indices {
                if let cIdx = boards[bIdx].lists[lIdx].cards.firstIndex(where: { $0.id == cardId }) {
                    boards[bIdx].lists[lIdx].cards[cIdx].items = newItems
                    boards[bIdx].lists[lIdx].cards[cIdx].hasChecklist = !newItems.isEmpty
                    saveLocalCache()
                    return
                }
            }
        }
    }
    
    public func requestSyncFromPhone() {
        sendToPhone(message: ["action": "requestSync"])
    }
    
    private func sendToPhone(message: [String: Any]) {
        guard WCSession.default.activationState == .activated else { return }
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { error in
                print("⚠️ [WatchSync] sendMessage failed: \(error.localizedDescription), using applicationContext")
                try? WCSession.default.updateApplicationContext(message)
            }
        } else {
            try? WCSession.default.updateApplicationContext(message)
        }
    }
    
    // MARK: - WCSessionDelegate
    
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            if activationState == .activated {
                self.requestSyncFromPhone()
                WatchPlaybackModel.shared.requestState(force: true)
            }
        }
    }
    
    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            if session.isReachable { WatchPlaybackModel.shared.requestState(force: true) }
        }
    }
    
    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleIncomingData(message)
    }
    
    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleIncomingData(applicationContext)
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        handleIncomingData(userInfo)
    }
    
    private func handleIncomingData(_ dict: [String: Any]) {
        DispatchQueue.main.async {
            if let playback = dict["playback"] as? Data { WatchPlaybackModel.shared.apply(playback) }

            // Watch 4.2: shared focus timer from the iPhone / Dynamic Island
            if let timer = dict["focusTimer"] as? [String: Any] {
                FocusWorkoutModel.shared.applyRemote(timer)
            }
            #if DEBUG
            // Development: replay the ceremonies on request from the phone
            if let dbg = dict["debugCeremony"] as? [String: Any] {
                self.enqueueCeremony(.rings(strikeDays: dbg["strikeDays"] as? Int ?? 1))
                if let badgeId = dbg["badgeId"] as? String, !badgeId.isEmpty {
                    self.enqueueCeremony(.claim(badgeId: badgeId))
                }
            }
            #endif
            // 31.6: Badge Wall unlocks from the iPhone
            if let wall = dict["badgeWall"] as? [String: Any] {
                self.applyBadgeWall(wall)
            }
            // Activity Rings Sync from iPhone
            if let rings = dict["activityRings"] as? [String: Any] {
                if let fM = rings["focusMinutes"] as? Int {
                    self.ringsState.focusMinutes = fM
                }
                if let cC = rings["checkCount"] as? Int {
                    self.ringsState.checkCount = cC
                }
                if let gP = rings["goalPercent"] as? Int {
                    self.ringsState.goalPercent = gP
                }
                if let sD = rings["strikeDays"] as? Int {
                    self.ringsState.strikeDays = sD
                }
                // Watch 4.0: goals set on the phone/web (skip briefly after a wrist edit)
                if !RingGoalSyncGuard.recentlyEditedOnWatch {
                    if let tM = rings["targetMinutes"] as? Int, tM > 0 { self.ringsState.targetMinutes = tM }
                    if let tC = rings["targetChecks"] as? Int, tC > 0 { self.ringsState.targetChecks = tC }
                    if let tG = rings["targetGoalPercent"] as? Int, tG > 0 { self.ringsState.targetGoalPercent = tG }
                }
                self.saveLocalCache()
                self.checkBadgeUnlocks()
                self.checkRingsCelebration()
            }
            
            // Full boards sync
            if let boardsData = dict["boards"] as? [[String: Any]] {
                let parsedBoards: [WatchBoardModel] = boardsData.compactMap { bDict in
                    guard let bId = bDict["id"] as? String,
                          let bTitle = bDict["title"] as? String else { return nil }
                    let bIcon = bDict["icon"] as? String ?? "folder.fill"
                    let bColor = bDict["colorHex"] as? String ?? "#22C55E"
                    
                    let listsData = bDict["lists"] as? [[String: Any]] ?? []
                    let parsedLists: [WatchListModel] = listsData.compactMap { lDict in
                        guard let lId = lDict["id"] as? String,
                              let lName = lDict["name"] as? String else { return nil }
                        let lIcon = lDict["icon"] as? String ?? "list.bullet"
                        let lColor = lDict["colorHex"] as? String ?? bColor
                        
                        let cardsData = lDict["cards"] as? [[String: Any]] ?? []
                        let parsedCards: [WatchCardModel] = cardsData.compactMap { cDict in
                            guard let cId = cDict["id"] as? String,
                                  let cTitle = cDict["title"] as? String else { return nil }
                            let cCat = cDict["category"] as? String ?? lName
                            let isDone = cDict["isCompleted"] as? Bool ?? (cDict["done"] as? Bool ?? false)
                            let hasChecklist = cDict["hasChecklist"] as? Bool ?? false
                            
                            let itemsData = cDict["items"] as? [[String: Any]] ?? []
                            let parsedItems: [WatchTaskItem] = itemsData.compactMap { iDict in
                                guard let iId = iDict["id"] as? String,
                                      let iText = iDict["text"] as? String else { return nil }
                                let itDone = iDict["isDone"] as? Bool ?? false
                                return WatchTaskItem(id: iId, text: iText, isDone: itDone)
                            }
                            
                            return WatchCardModel(
                                id: cId,
                                title: cTitle,
                                isCompleted: isDone,
                                category: cCat,
                                hasChecklist: hasChecklist || !parsedItems.isEmpty,
                                items: parsedItems
                            )
                        }
                        
                        return WatchListModel(
                            id: lId,
                            name: lName,
                            icon: lIcon,
                            colorHex: lColor,
                            boardId: bId,
                            cards: parsedCards
                        )
                    }
                    
                    return WatchBoardModel(
                        id: bId,
                        title: bTitle,
                        icon: bIcon,
                        colorHex: bColor,
                        lists: parsedLists
                    )
                }
                
                if !parsedBoards.isEmpty {
                    self.boards = parsedBoards
                }
            } else if let listsData = dict["lists"] as? [[String: Any]] {
                // Lists sync for current board
                let parsedLists: [WatchListModel] = listsData.compactMap { lDict in
                    guard let id = lDict["id"] as? String,
                          let name = lDict["name"] as? String else { return nil }
                    let icon = lDict["icon"] as? String ?? "list.bullet"
                    let colorHex = lDict["colorHex"] as? String ?? "#22C55E"
                    
                    let cardsData = lDict["cards"] as? [[String: Any]] ?? []
                    let parsedCards: [WatchCardModel] = cardsData.compactMap { cDict in
                        guard let cId = cDict["id"] as? String,
                              let title = cDict["title"] as? String else { return nil }
                        let cat = cDict["category"] as? String ?? name
                        let isDone = cDict["isCompleted"] as? Bool ?? (cDict["done"] as? Bool ?? false)
                        let hasChecklist = cDict["hasChecklist"] as? Bool ?? false
                        
                        let itemsData = cDict["items"] as? [[String: Any]] ?? []
                        let parsedItems: [WatchTaskItem] = itemsData.compactMap { iDict in
                            guard let iId = iDict["id"] as? String,
                                  let text = iDict["text"] as? String else { return nil }
                            let itDone = iDict["isDone"] as? Bool ?? false
                            return WatchTaskItem(id: iId, text: text, isDone: itDone)
                        }
                        
                        return WatchCardModel(
                            id: cId,
                            title: title,
                            isCompleted: isDone,
                            category: cat,
                            hasChecklist: hasChecklist || !parsedItems.isEmpty,
                            items: parsedItems
                        )
                    }
                    
                    return WatchListModel(
                        id: id,
                        name: name,
                        icon: icon,
                        colorHex: colorHex,
                        boardId: self.selectedBoardId,
                        cards: parsedCards
                    )
                }
                
                if !parsedLists.isEmpty {
                    if let bIdx = self.boards.firstIndex(where: { $0.id == self.selectedBoardId }) {
                        self.boards[bIdx].lists = parsedLists
                    } else {
                        let newBoard = WatchBoardModel(
                            id: self.selectedBoardId,
                            title: self.boardTitle,
                            icon: "folder.fill",
                            colorHex: "#22C55E",
                            lists: parsedLists
                        )
                        self.boards.append(newBoard)
                    }
                }
            }
            
            if let activeBId = dict["selectedBoardId"] as? String ?? dict["activeBoardId"] as? String,
               self.boards.contains(where: { $0.id == activeBId }) {
                self.selectedBoardId = activeBId
            } else if !self.boards.contains(where: { $0.id == self.selectedBoardId }), let first = self.boards.first {
                self.selectedBoardId = first.id
            }
            
            if let activeLId = dict["selectedListId"] as? String ?? dict["activeListId"] as? String,
               self.currentLists.contains(where: { $0.id == activeLId }) {
                self.selectedListId = activeLId
            } else if !self.currentLists.contains(where: { $0.id == self.selectedListId }), let firstList = self.currentLists.first {
                self.selectedListId = firstList.id
            }
            
            UserDefaults.standard.set(self.selectedBoardId, forKey: self.selectedBoardKey)
            UserDefaults.standard.set(self.selectedListId, forKey: self.selectedListKey)
            self.lastSyncDate = Date()
            self.saveLocalCache()
        }
    }
}
