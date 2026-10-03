import Foundation
import WatchConnectivity
import WidgetKit
import ActivityKit
import WebKit

/// iPhone-side WatchConnectivity manager
/// Keeps iPhone and Apple Watch lists, cards, and checklists in 100% real-time sync
public final class iPhoneWatchSyncManager: NSObject, WCSessionDelegate {
    public static let shared = iPhoneWatchSyncManager()
    public weak var bridge: MinestBridge?
    
    private let watchListsKey = "minest_iphone_watch_lists_v2"
    private let watchBoardsKey = "minest_iphone_watch_boards_v3"
    private let watchRingsKey = "minest_iphone_watch_rings_v1"
    private let selectedBoardKey = "minest_iphone_selected_board_id"
    private let selectedListKey = "minest_iphone_selected_list_id"
    
    public var selectedBoardId: String = ""
    public var selectedListId: String = ""
    
    public override init() {
        self.selectedBoardId = UserDefaults.standard.string(forKey: selectedBoardKey) ?? ""
        self.selectedListId = UserDefaults.standard.string(forKey: selectedListKey) ?? ""
        super.init()
        setupWCSession()
    }
    
    public func setSelectedBoard(_ boardId: String) {
        guard !boardId.isEmpty else { return }
        self.selectedBoardId = boardId
        UserDefaults.standard.set(boardId, forKey: selectedBoardKey)
        syncToWatch()
    }
    
    public func setSelectedList(_ listId: String) {
        guard !listId.isEmpty else { return }
        self.selectedListId = listId
        UserDefaults.standard.set(listId, forKey: selectedListKey)
        syncToWatch()
    }
    
    public func setupWCSession() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    /// Push current multi-list, boards, and checklist state to Apple Watch
    public func syncToWatch() {
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        
        let items = MinestWidgetDataStore.shared.getItems()
        let titles = MinestWidgetDataStore.shared.getTitles()
        
        let itemsPayload: [[String: Any]] = items.map { item in
            [
                "id": item.id,
                "text": item.text,
                "isDone": item.isDone
            ]
        }
        
        var payload: [String: Any] = [
            "items": itemsPayload,
            "boardTitle": titles.board,
            "cardTitle": titles.card,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        // Attach cached boards if present
        if let boardsData = UserDefaults.standard.data(forKey: watchBoardsKey),
           let json = try? JSONSerialization.jsonObject(with: boardsData) as? [[String: Any]] {
            payload["boards"] = json
        }
        
        // Also attach cached multi-lists if present
        if let listsData = UserDefaults.standard.data(forKey: watchListsKey),
           let json = try? JSONSerialization.jsonObject(with: listsData) as? [[String: Any]] {
            payload["lists"] = json
        }
        
        // Attach cached activity rings if present
        if let ringsData = UserDefaults.standard.data(forKey: watchRingsKey),
           let json = try? JSONSerialization.jsonObject(with: ringsData) as? [String: Any] {
            payload["activityRings"] = json
        }
        
        if let wall = cachedBadgeWall() {
            payload["badgeWall"] = wall
        }
        if !selectedBoardId.isEmpty {
            payload["selectedBoardId"] = selectedBoardId
        }
        if !selectedListId.isEmpty {
            payload["selectedListId"] = selectedListId
        }
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { _ in
                try? WCSession.default.updateApplicationContext(payload)
            }
        } else {
            try? WCSession.default.updateApplicationContext(payload)
        }
    }
    
    /// Push 3-Ring Activity State to Apple Watch
    public func pushActivityRingsToWatch(focusMinutes: Int, checkCount: Int, goalPercent: Int, targetMinutes: Int = 30, targetChecks: Int = 10, targetGoalPercent: Int = 100, strikeDays: Int? = nil) {
        var ringsDict: [String: Any] = [
            "focusMinutes": focusMinutes,
            "targetMinutes": targetMinutes,
            "checkCount": checkCount,
            "targetChecks": targetChecks,
            "goalPercent": goalPercent,
            "targetGoalPercent": targetGoalPercent
        ]
        if let strikeDays = strikeDays { ringsDict["strikeDays"] = strikeDays }
        if let encoded = try? JSONSerialization.data(withJSONObject: ringsDict) {
            UserDefaults.standard.set(encoded, forKey: watchRingsKey)
        }
        
        var payload: [String: Any] = [
            "activityRings": ringsDict,
            "timestamp": Date().timeIntervalSince1970
        ]
        if let wall = cachedBadgeWall() {
            payload["badgeWall"] = wall
        }
        
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { _ in
                try? WCSession.default.updateApplicationContext(payload)
            }
        } else {
            try? WCSession.default.updateApplicationContext(payload)
        }
    }
    
    // MARK: - 31.6 Badge Wall

    private let watchBadgeWallKey = "minest_watch_badge_wall_ids_v1"

    private func cachedBadgeWall() -> [String: Any]? {
        guard let ids = UserDefaults.standard.stringArray(forKey: watchBadgeWallKey) else { return nil }
        return ["unlockedIds": ids]
    }

    /// Mirror the Badge Wall unlocks (claim-only ids from the web app) to Apple Watch.
    public func pushBadgeWallToWatch(unlockedIds: [String]) {
        let ids = Array(Set(unlockedIds)).sorted()
        // Always cache first; the full sync and ring pushes attach the cached list too,
        // so a send that happens before the watch session is ready is not lost.
        UserDefaults.standard.set(ids, forKey: watchBadgeWallKey)

        let payload: [String: Any] = [
            "badgeWall": ["unlockedIds": ids],
            "timestamp": Date().timeIntervalSince1970
        ]
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { _ in
                WCSession.default.transferUserInfo(payload)
            }
        } else {
            WCSession.default.transferUserInfo(payload)
        }
    }

    /// Save boards from Web canvas and push to Apple Watch
    public func updateBoardsFromWeb(boardsJSON: String) {
        guard let data = boardsJSON.data(using: .utf8),
              let boards = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return }
        
        let colors = ["#22C55E", "#3B82F6", "#A855F7", "#F97316", "#EC4899", "#14B8A6"]
        let icons = ["book.closed.fill", "checklist", "star.fill", "brain.head.profile", "sparkles", "folder.fill"]
        
        var watchBoards: [[String: Any]] = []
        var allWatchLists: [[String: Any]] = []
        
        for (bIdx, b) in boards.enumerated() {
            guard let bId = b["id"] as? String ?? (b["title"] as? String) else { continue }
            let bTitle = b["title"] as? String ?? "看板 \(bIdx + 1)"
            let bColorHex = colors[bIdx % colors.count]
            let bIcon = icons[bIdx % icons.count]
            
            var boardLists: [[String: Any]] = []
            
            if let columns = b["columns"] as? [[String: Any]], !columns.isEmpty {
                for (cIdx, col) in columns.enumerated() {
                    let colId = col["id"] as? String ?? "col-\(cIdx)"
                    let colTitle = col["title"] as? String ?? "列表 \(cIdx + 1)"
                    let colColorHex = (col["color"] as? String) ?? colors[(bIdx + cIdx) % colors.count]
                    let colIcon = (cIdx == 0 ? "book.closed.fill" : (cIdx == 1 ? "checklist" : "folder.fill"))
                    
                    let cardsList = (col["cards"] as? [[String: Any]]) ?? []
                    let watchCards: [[String: Any]] = cardsList.map { c in
                        let cId = c["id"] as? String ?? UUID().uuidString
                        let cTitle = c["title"] as? String ?? "卡片"
                        let isDone = (c["complete"] as? Bool) ?? (c["isDone"] as? Bool) ?? (c["done"] as? Bool) ?? false
                        let cCategory = c["category"] as? String ?? colTitle
                        
                        let checkItems = c["checklistItems"] as? [[String: Any]] ?? []
                        let parsedItems: [[String: Any]] = checkItems.compactMap { it in
                            guard let text = it["text"] as? String ?? it["title"] as? String else { return nil }
                            let itId = it["id"] as? String ?? text
                            let done = it["done"] as? Bool ?? (it["isDone"] as? Bool ?? false)
                            return ["id": itId, "text": text, "isDone": done]
                        }
                        
                        return [
                            "id": cId,
                            "title": cTitle,
                            "isCompleted": isDone,
                            "category": cCategory,
                            "hasChecklist": !parsedItems.isEmpty,
                            "items": parsedItems
                        ]
                    }
                    
                    let listDict: [String: Any] = [
                        "id": colId,
                        "name": colTitle,
                        "icon": colIcon,
                        "colorHex": colColorHex,
                        "boardId": bId,
                        "cards": watchCards
                    ]
                    boardLists.append(listDict)
                    allWatchLists.append(listDict)
                }
            }
            
            watchBoards.append([
                "id": bId,
                "title": bTitle,
                "icon": bIcon,
                "colorHex": bColorHex,
                "lists": boardLists
            ])
        }
        
        if !watchBoards.isEmpty {
            if self.selectedBoardId.isEmpty || !watchBoards.contains(where: { ($0["id"] as? String) == self.selectedBoardId }) {
                self.selectedBoardId = watchBoards.first?["id"] as? String ?? ""
                UserDefaults.standard.set(self.selectedBoardId, forKey: selectedBoardKey)
            }
            let currentBoardLists = (watchBoards.first(where: { ($0["id"] as? String) == self.selectedBoardId })?["lists"] as? [[String: Any]]) ?? []
            if self.selectedListId.isEmpty || !currentBoardLists.contains(where: { ($0["id"] as? String) == self.selectedListId }) {
                self.selectedListId = currentBoardLists.first?["id"] as? String ?? ""
                UserDefaults.standard.set(self.selectedListId, forKey: selectedListKey)
            }
            if let encoded = try? JSONSerialization.data(withJSONObject: watchBoards) {
                UserDefaults.standard.set(encoded, forKey: watchBoardsKey)
            }
            if let encodedLists = try? JSONSerialization.data(withJSONObject: allWatchLists) {
                UserDefaults.standard.set(encodedLists, forKey: watchListsKey)
            }
            syncToWatch()
        }
    }
    
    // MARK: - WCSessionDelegate
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            syncToWatch()
        }
    }
    
    public func sessionDidBecomeInactive(_ session: WCSession) {}
    
    public func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
    
    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleWatchMessage(message)
    }
    
    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleWatchMessage(applicationContext)
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        handleWatchMessage(userInfo)
    }

    /// Shared focus timer (Dynamic Island ⇄ Watch). Queued delivery so it never clobbers the
    /// boards/rings application context and still arrives when the watch app opens later.
    public func sendFocusTimerToWatch(_ payload: [String: Any]) {
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        let message: [String: Any] = ["focusTimer": payload]
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { _ in
                WCSession.default.transferUserInfo(message)
            }
        } else {
            WCSession.default.transferUserInfo(message)
        }
    }
    
    private func handleWatchMessage(_ dict: [String: Any]) {
        guard let action = dict["action"] as? String else { return }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            switch action {
            case "toggleCard":
                if let cardId = dict["cardId"] as? String {
                    let isDone = (dict["isDone"] as? Bool) ?? true
                    print("⌚️ [iPhoneWatchSync] Watch toggled card: \(cardId) -> \(isDone)")
                    
                    self.bridge?.sendEventToWeb(event: "cardToggled", payload: [
                        "cardId": cardId,
                        "isDone": isDone
                    ])
                    
                    let js = """
                    (function() {
                        var cardId = '\(cardId)';
                        if (window.MinestNative && window.MinestNative.toggleCard) {
                            window.MinestNative.toggleCard(cardId);
                        }
                        window.dispatchEvent(new CustomEvent('minestCardToggled', { detail: { cardId: cardId } }));
                    })();
                    """
                    self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
                    
                    NativeSoundAndHaptics.shared.playChecklistTick(isDone: isDone)
                }
                
            case "toggleItem", "toggleCardItem":
                if let id = dict["id"] as? String ?? dict["itemId"] as? String {
                    let cardId = dict["cardId"] as? String ?? ""
                    print("⌚️ [iPhoneWatchSync] Watch toggled item: \(id) in card: \(cardId)")
                    MinestWidgetDataStore.shared.toggleItem(id: id)
                    WidgetCenter.shared.reloadAllTimelines()
                    
                    // Update Live Activity if active
                    for activity in Activity<StudyActivityAttributes>.activities {
                        var currentItems = activity.content.state.items
                        if let idx = currentItems.firstIndex(where: { $0.id == id }) {
                            currentItems[idx].isDone.toggle()
                        }
                        let doneCount = currentItems.filter { $0.isDone }.count
                        let totalCount = currentItems.count
                        let updatedState = StudyActivityAttributes.ContentState(
                            completedCount: doneCount,
                            totalCount: max(totalCount, 1),
                            cardTitle: activity.content.state.cardTitle,
                            itemText: currentItems.first(where: { !$0.isDone })?.text ?? "已全部完成 🎉",
                            mode: activity.content.state.mode,
                            remainingMinutes: activity.content.state.remainingMinutes,
                            isAllDone: doneCount >= totalCount && totalCount > 0,
                            items: currentItems
                        )
                        Task {
                            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
                        }
                    }
                    
                    // Notify Web Canvas
                    self.bridge?.sendEventToWeb(event: "checklistToggled", payload: [
                        "id": id,
                        "cardId": cardId
                    ])
                }
                
            case "addCardItem":
                if let cardId = dict["cardId"] as? String,
                   let text = dict["text"] as? String {
                    let itemId = dict["id"] as? String ?? UUID().uuidString
                    print("⌚️ [iPhoneWatchSync] Watch added checklist item to card \(cardId): \(text)")
                    
                    // Notify Web Canvas
                    self.bridge?.sendEventToWeb(event: "checklistItemAdded", payload: [
                        "cardId": cardId,
                        "id": itemId,
                        "text": text
                    ])
                }
                
            case "addItem", "addCard":
                if let title = dict["title"] as? String {
                    let id = dict["id"] as? String ?? "watch-\(UUID().uuidString.prefix(6))"
                    let category = dict["category"] as? String ?? "手表随手记"
                    let initialItem = dict["initialItem"] as? String ?? title
                    print("⌚️ [iPhoneWatchSync] Watch added card: \(title)")
                    MinestWidgetDataStore.shared.addCard(id: id, title: title, category: category)
                    WidgetCenter.shared.reloadAllTimelines()
                    self.bridge?.createCard(id: id, title: title, category: category, item: initialItem)
                    self.syncToWatch()
                }
                
            case "focusTimer":
                // Watch started / paused / resumed / ended the shared focus timer
                if let payload = dict["focusTimer"] as? [String: Any] {
                    Task { @MainActor in LiveActivityManager.shared.applyWatchTimer(payload) }
                }

            case "requestFocusTimer":
                Task { @MainActor in LiveActivityManager.shared.sendTimerToWatch(force: true) }

            case "updateRingGoals":
                // Watch 4.0: goals changed on the watch → web Summary goals
                let targetM = dict["targetMinutes"] as? Int ?? 30
                let targetC = dict["targetChecks"] as? Int ?? 10
                let targetG = dict["targetGoalPercent"] as? Int ?? 100
                print("⌚️ [iPhoneWatchSync] Watch updated ring goals: \(targetM)m, \(targetC) checks, \(targetG)%")
                let js = """
                (function() {
                    window.dispatchEvent(new CustomEvent('minestActivityRingsUpdated', {
                        detail: { targetMinutes: \(targetM), targetChecks: \(targetC), targetGoalPercent: \(targetG) }
                    }));
                })();
                """
                self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)

            case "selectBoard":
                if let boardId = dict["boardId"] as? String {
                    print("⌚️ [iPhoneWatchSync] Watch switched active board to: \(boardId)")
                    self.selectedBoardId = boardId
                    UserDefaults.standard.set(boardId, forKey: self.selectedBoardKey)
                    self.bridge?.sendEventToWeb(event: "watchBoardSelected", payload: ["boardId": boardId])
                }
                
            case "selectList":
                if let listId = dict["listId"] as? String {
                    print("⌚️ [iPhoneWatchSync] Watch switched active list to: \(listId)")
                    self.selectedListId = listId
                    UserDefaults.standard.set(listId, forKey: self.selectedListKey)
                    self.bridge?.sendEventToWeb(event: "watchListSelected", payload: ["listId": listId])
                }
                
            case "updateActivityRings":
                if let focusM = dict["focusMinutes"] as? Int,
                   let checkC = dict["checkCount"] as? Int,
                   let goalP = dict["goalPercent"] as? Int {
                    print("⌚️ [iPhoneWatchSync] Watch updated activity rings: \(focusM)m, \(checkC) checks, \(goalP)%")
                    let ringsDict: [String: Any] = [
                        "focusMinutes": focusM,
                        "checkCount": checkC,
                        "goalPercent": goalP
                    ]
                    if let encoded = try? JSONSerialization.data(withJSONObject: ringsDict) {
                        UserDefaults.standard.set(encoded, forKey: self.watchRingsKey)
                    }
                    self.bridge?.sendEventToWeb(event: "activityRingsUpdated", payload: ringsDict)
                    // Dynamic Island follows rings changed on the watch (goals/strike keep their last values)
                    Task { @MainActor in
                        let last = LiveActivityManager.shared.latestRings
                        let tM = dict["targetMinutes"] as? Int ?? 30
                        let tC = dict["targetChecks"] as? Int ?? 10
                        let tG = dict["targetGoalPercent"] as? Int ?? 100
                        LiveActivityManager.shared.updateRings(
                            focusMinutes: focusM, targetMinutes: tM, checkCount: checkC, targetChecks: tC,
                            goalPercent: goalP, targetGoalPercent: tG, strikeDays: last.strikeDays
                        )
                    }
                    let js = """
                    (function() {
                        window.dispatchEvent(new CustomEvent('minestActivityRingsUpdated', {
                            detail: {
                                focusMinutes: \(focusM),
                                checkCount: \(checkC),
                                goalPercent: \(goalP)
                            }
                        }));
                    })();
                    """
                    self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
                }
                
            case "requestSync":
                self.syncToWatch()
                
            default:
                break
            }
        }
    }
}
