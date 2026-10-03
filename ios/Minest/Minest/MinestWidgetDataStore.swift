import Foundation
import ActivityKit

/// Data persistence and synchronization store for Home Screen checklist widgets & Dynamic Island
public final class MinestWidgetDataStore {
    public static let shared = MinestWidgetDataStore()
    
    private let defaultsKey = "minest_widget_checklist_items"
    private let boardTitleKey = "minest_widget_board_title"
    private let cardTitleKey = "minest_widget_card_title"
    
    /// 31.6: shared with the widget extension through the App Group; plain
    /// `.standard` defaults are private to each process, so the widget never saw
    /// the app's data and fell back to the sample list.
    private let store = UserDefaults(suiteName: "group.com.zouminmin.minest") ?? .standard

    private init() {}
    
    /// Default checklist tasks if no board has synced yet
    private var fallbackItems: [StudyActivityAttributes.ChecklistItemState] {
        [
            StudyActivityAttributes.ChecklistItemState(id: "chk-1", text: "Proactive classroom procedures", isDone: true),
            StudyActivityAttributes.ChecklistItemState(id: "chk-2", text: "Restorative justice practices", isDone: true),
            StudyActivityAttributes.ChecklistItemState(id: "chk-3", text: "Phoneme segmentation drills", isDone: false),
            StudyActivityAttributes.ChecklistItemState(id: "chk-4", text: "Grapheme-phoneme mapping cards", isDone: false),
            StudyActivityAttributes.ChecklistItemState(id: "chk-5", text: "Formative exit tickets review", isDone: false)
        ]
    }
    
    /// Get the home list items mirrored from the app (fallback until the first sync)
    public func getItems() -> [StudyActivityAttributes.ChecklistItemState] {
        if let data = store.data(forKey: defaultsKey),
           let decoded = try? JSONDecoder().decode([StudyActivityAttributes.ChecklistItemState].self, from: data),
           !decoded.isEmpty {
            return decoded
        }
        
        return fallbackItems
    }
    
    /// Get current board & card title
    public func getTitles() -> (board: String, card: String) {
        let board = store.string(forKey: boardTitleKey) ?? "Minest 学习看板"
        let card = store.string(forKey: cardTitleKey) ?? "Core Subjects: Literacy & Math"
        return (board, card)
    }
    
    /// Save items into cache
    public func saveItems(_ items: [StudyActivityAttributes.ChecklistItemState], boardTitle: String? = nil, cardTitle: String? = nil) {
        if let encoded = try? JSONEncoder().encode(items) {
            store.set(encoded, forKey: defaultsKey)
        }
        if let board = boardTitle {
            store.set(board, forKey: boardTitleKey)
        }
        if let card = cardTitle {
            store.set(card, forKey: cardTitleKey)
        }
    }
    
    /// Toggle item state
    public func toggleItem(id: String) {
        // 31.6: remember the change so the app can apply it to the board on next launch
        var pending = store.array(forKey: pendingTogglesKey) as? [[String: Any]] ?? []
        let wasDone = getItems().first(where: { $0.id == id })?.isDone ?? false
        pending.append(["id": id, "done": !wasDone])
        store.set(pending, forKey: pendingTogglesKey)
        var items = getItems()
        if let idx = items.firstIndex(where: { $0.id == id }) {
            items[idx].isDone.toggle()
        }
        saveItems(items)
    }

    // MARK: - 31.6 Widget ticks waiting to be applied to the board
    private let pendingTogglesKey = "minest_widget_pending_toggles"

    /// Card ticks made on the widget since the app last ran; cleared on read.
    public func consumePendingToggles() -> [(id: String, done: Bool)] {
        let list = store.array(forKey: pendingTogglesKey) as? [[String: Any]] ?? []
        store.removeObject(forKey: pendingTogglesKey)
        return list.compactMap { d in
            guard let id = d["id"] as? String else { return nil }
            return (id, d["done"] as? Bool ?? true)
        }
    }
    
    // MARK: - Siri Card Creation & Pending Queue
    private let pendingCardsKey = "minest_pending_siri_cards"
    
    /// Add a new card from Siri or external Intent
    public func addCard(id: String, title: String, category: String, initialItem: String? = nil) {
        var items = getItems()
        let taskText = (initialItem?.isEmpty == false) ? initialItem! : title
        items.insert(StudyActivityAttributes.ChecklistItemState(id: id, text: taskText, isDone: false), at: 0)
        saveItems(items, boardTitle: category, cardTitle: title)
        
        // Save to pending queue for web app ingestion
        var pending = getPendingCards()
        pending.append([
            "id": id,
            "title": title,
            "category": category,
            "item": taskText,
            "timestamp": Date().timeIntervalSince1970
        ])
        if let data = try? JSONSerialization.data(withJSONObject: pending) {
            store.set(data, forKey: pendingCardsKey)
        }
    }
    
    private func getPendingCards() -> [[String: Any]] {
        guard let data = store.data(forKey: pendingCardsKey),
              let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return list
    }
    
    /// Retrieve and clear pending cards that were created by Siri while app was inactive
    public func consumePendingCards() -> [[String: Any]] {
        let list = getPendingCards()
        if !list.isEmpty {
            store.removeObject(forKey: pendingCardsKey)
        }
        return list
    }
}
