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

// MARK: - WatchSyncManager

/// Watch-side data sync manager connecting to iPhone via WCSession
/// Complete hierarchy: Boards -> Lists -> Cards (Checkable) -> Sub-Checklists + 3-Ring Activity & Badges
public final class WatchSyncManager: NSObject, ObservableObject, WCSessionDelegate {
    public static let shared = WatchSyncManager()
    
    @Published public var boards: [WatchBoardModel] = []
    @Published public var selectedBoardId: String = "board-peck-v1"
    @Published public var selectedListId: String = "col-lm"
    @Published public var isReachable: Bool = false
    @Published public var lastSyncDate: Date = Date()
    
    // 3-Ring Activity & Digital Badges
    @Published public var ringsState: ActivityRingsState = ActivityRingsState()
    /// Watch 4.0: true while a focus workout is counting or paused
    public var isFocusWorkoutActive: Bool = false
    @Published public var badges: [WatchBadgeModel] = WatchSyncManager.makeDefaultBadges()
    
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
           !decoded.isEmpty {
            self.boards = decoded
        } else {
            self.boards = Self.makeDefaultBoards()
        }
        
        let savedBoardId = UserDefaults.standard.string(forKey: selectedBoardKey) ?? ""
        if boards.contains(where: { $0.id == savedBoardId }) {
            self.selectedBoardId = savedBoardId
        } else {
            self.selectedBoardId = boards.first?.id ?? "board-peck-v1"
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
    
    public static func makeDefaultBoards() -> [WatchBoardModel] {
        // Board 1: Peck Learning System v1
        let loopCard = WatchCardModel(
            id: "c-loop",
            title: "Learning Loop",
            isCompleted: false,
            category: "Learning Map",
            hasChecklist: true,
            items: [
                WatchTaskItem(id: "chk-1", text: "Input Comprehension", isDone: false),
                WatchTaskItem(id: "chk-2", text: "Pattern Synthesis", isDone: false),
                WatchTaskItem(id: "chk-3", text: "Active Encoding", isDone: false),
                WatchTaskItem(id: "chk-4", text: "Retrieval Attempt", isDone: false),
                WatchTaskItem(id: "chk-5", text: "Error Reflection", isDone: false)
            ]
        )
        let schemaCard = WatchCardModel(id: "c-schema", title: "Schema Synthesis Engine", isCompleted: false, category: "Learning Map")
        let dualCard = WatchCardModel(id: "c-dual", title: "Dual Coding Taxonomy", isCompleted: false, category: "Learning Map")
        let spacingCard = WatchCardModel(id: "c-spacing", title: "Spaced Interval Schedule", isCompleted: false, category: "Learning Map")
        let metacogCard = WatchCardModel(id: "c-metacog", title: "Metacognitive Calibration", isCompleted: false, category: "Learning Map")
        let reflectionCard = WatchCardModel(id: "c-reflection", title: "Deep Review Journal", isCompleted: false, category: "Learning Map")
        
        let listLearningMap = WatchListModel(
            id: "col-lm",
            name: "Learning Map",
            icon: "book.closed.fill",
            colorHex: "#10B981",
            boardId: "board-peck-v1",
            cards: [loopCard, schemaCard, dualCard, spacingCard, metacogCard, reflectionCard]
        )
        
        let connCard = WatchCardModel(id: "c-conn", title: "Connected Text", isCompleted: false, category: "English / EC-6 Engine")
        let outputCard = WatchCardModel(id: "c-output", title: "Output", isCompleted: false, category: "English / EC-6 Engine")
        let wordRecCard = WatchCardModel(id: "c-word-rec", title: "Word Recognition", isCompleted: true, category: "English / EC-6 Engine")
        let phonemicCard = WatchCardModel(id: "c-phonemic", title: "Phonemic Awareness", isCompleted: false, category: "English / EC-6 Engine")
        let syntaxCard = WatchCardModel(id: "c-syntax", title: "Syntax & Grammar Scaffolds", isCompleted: false, category: "English / EC-6 Engine")
        let guidedCard = WatchCardModel(id: "c-guided", title: "Guided Reading Miscue Analysis", isCompleted: false, category: "English / EC-6 Engine")
        
        let listEngine = WatchListModel(
            id: "col-engine",
            name: "English / EC-6 Engine",
            icon: "checklist",
            colorHex: "#0A84FF",
            boardId: "board-peck-v1",
            cards: [connCard, outputCard, wordRecCard, phonemicCard, syntaxCard, guidedCard]
        )
        
        let devStagesCard = WatchCardModel(id: "c-dev-stages", title: "Child Development & Learning Stages", isCompleted: false, category: "Foundations & Pedagogy")
        let scaffoldCard = WatchCardModel(id: "c-scaffolding", title: "Zone of Proximal Development & Scaffolding", isCompleted: false, category: "Foundations & Pedagogy")
        let normsCard = WatchCardModel(id: "c-norms", title: "Classroom Norms & PBIS Protocols", isCompleted: true, category: "Foundations & Pedagogy")
        
        let listFoundations = WatchListModel(
            id: "col-foundations",
            name: "Foundations & Pedagogy",
            icon: "graduationcap.fill",
            colorHex: "#10B981",
            boardId: "board-peck-v1",
            cards: [devStagesCard, scaffoldCard, normsCard]
        )
        
        let diagCard = WatchCardModel(id: "c-tExES-diag", title: "Official TExES EC-6 Diagnostic Exam", isCompleted: false, category: "Review & Practice Tests")
        let teksCard = WatchCardModel(id: "c-teks-align", title: "State TEKS Competency Matrix", isCompleted: false, category: "Review & Practice Tests")
        
        let listReview = WatchListModel(
            id: "col-review",
            name: "Review & Practice Tests",
            icon: "doc.text.fill",
            colorHex: "#BF5AF2",
            boardId: "board-peck-v1",
            cards: [diagCard, teksCard]
        )
        
        let boardPeck = WatchBoardModel(
            id: "board-peck-v1",
            title: "Peck Learning System v1",
            icon: "brain.head.profile",
            colorHex: "#10B981",
            lists: [listLearningMap, listEngine, listFoundations, listReview]
        )
        
        // Board 2: EC-6 Learning Plan
        let phonicsCard = WatchCardModel(
            id: "c-phonics",
            title: "Phonological Awareness & Phonics",
            isCompleted: false,
            category: "Core Subjects",
            hasChecklist: true,
            items: [
                WatchTaskItem(id: "chk-pho-1", text: "Phoneme isolation drills", isDone: true),
                WatchTaskItem(id: "chk-pho-2", text: "Grapheme-phoneme mapping cards", isDone: false)
            ]
        )
        let mathCard = WatchCardModel(
            id: "c-math-teks",
            title: "Elementary Mathematics TEKS Standards",
            isCompleted: false,
            category: "Core Subjects",
            hasChecklist: true,
            items: [
                WatchTaskItem(id: "chk-m-1", text: "Base-ten blocks place value", isDone: true),
                WatchTaskItem(id: "chk-m-2", text: "Fraction bar equivalency", isDone: false)
            ]
        )
        let listReadingMath = WatchListModel(
            id: "col-reading-math",
            name: "Core Subjects: Literacy & Math",
            icon: "text.book.closed.fill",
            colorHex: "#0A84FF",
            boardId: "board-ec6-learning-plan",
            cards: [phonicsCard, mathCard]
        )
        let boardPlan = WatchBoardModel(
            id: "board-ec6-learning-plan",
            title: "EC-6 Learning Plan",
            icon: "folder.fill",
            colorHex: "#3B82F6",
            lists: [listFoundations, listReadingMath, listReview]
        )
        
        // Board 3: EC-6 Vocabulary Library
        let phonemeCard = WatchCardModel(id: "v-phoneme", title: "Phoneme vs Morpheme", isCompleted: false, category: "Linguistic Terms")
        let zpdCard = WatchCardModel(id: "v-zpd", title: "Zone of Proximal Development (ZPD)", isCompleted: false, category: "Pedagogy Terms")
        let listVocabLit = WatchListModel(
            id: "col-vocab-lit",
            name: "Linguistic & Literacy Terms",
            icon: "character.book.closed.fill",
            colorHex: "#0A84FF",
            boardId: "board-ec6-vocabulary",
            cards: [phonemeCard]
        )
        let listVocabPed = WatchListModel(
            id: "col-vocab-ped",
            name: "Pedagogy & Classroom Terms",
            icon: "person.2.fill",
            colorHex: "#30D158",
            boardId: "board-ec6-vocabulary",
            cards: [zpdCard]
        )
        let boardVocab = WatchBoardModel(
            id: "board-ec6-vocabulary",
            title: "EC-6 Vocabulary Library",
            icon: "books.vertical.fill",
            colorHex: "#8B5CF6",
            lists: [listVocabLit, listVocabPed]
        )
        
        return [boardPeck, boardPlan, boardVocab]
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
            "goalPercent": ringsState.goalPercent
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
        var didUnlockAny = false
        
        // 1. 三圈圆满
        if ringsState.isAllClosed {
            if let idx = badges.firstIndex(where: { $0.id == "badge-perfect-closure" }), !badges[idx].isUnlocked {
                badges[idx].isUnlocked = true
                badges[idx].unlockedDate = Date()
                didUnlockAny = true
            }
        }
        
        // 2. 心流大师
        if ringsState.focusMinutes >= ringsState.targetMinutes {
            if let idx = badges.firstIndex(where: { $0.id == "badge-deep-focus" }), !badges[idx].isUnlocked {
                badges[idx].isUnlocked = true
                badges[idx].unlockedDate = Date()
                didUnlockAny = true
            }
        }
        
        // 3. 神速打勾
        if ringsState.checkCount >= ringsState.targetChecks {
            if let idx = badges.firstIndex(where: { $0.id == "badge-lightning-check" }), !badges[idx].isUnlocked {
                badges[idx].isUnlocked = true
                badges[idx].unlockedDate = Date()
                didUnlockAny = true
            }
        }
        
        // 4. 清单征服
        if let list = currentList, list.totalCardsCount > 0, list.completedCardsCount >= list.totalCardsCount {
            if let idx = badges.firstIndex(where: { $0.id == "badge-list-conqueror" }), !badges[idx].isUnlocked {
                badges[idx].isUnlocked = true
                badges[idx].unlockedDate = Date()
                didUnlockAny = true
            }
        }
        
        if didUnlockAny {
            WKInterfaceDevice.current().play(.success)
        }
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
            }
        }
    }
    
    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }
    
    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleIncomingData(message)
    }
    
    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleIncomingData(applicationContext)
    }
    
    private func handleIncomingData(_ dict: [String: Any]) {
        DispatchQueue.main.async {
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
                // Watch 4.0: goals set on the phone/web (skip briefly after a wrist edit)
                if !RingGoalSyncGuard.recentlyEditedOnWatch {
                    if let tM = rings["targetMinutes"] as? Int, tM > 0 { self.ringsState.targetMinutes = tM }
                    if let tC = rings["targetChecks"] as? Int, tC > 0 { self.ringsState.targetChecks = tC }
                    if let tG = rings["targetGoalPercent"] as? Int, tG > 0 { self.ringsState.targetGoalPercent = tG }
                }
                self.saveLocalCache()
                self.checkBadgeUnlocks()
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
