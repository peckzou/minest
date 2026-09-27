import Foundation
import ActivityKit

/// Data persistence and synchronization store for Home Screen checklist widgets & Dynamic Island
public final class MinestWidgetDataStore {
    public static let shared = MinestWidgetDataStore()
    
    private let defaultsKey = "minest_widget_checklist_items"
    private let boardTitleKey = "minest_widget_board_title"
    private let cardTitleKey = "minest_widget_card_title"
    
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
    
    /// Get current checklist items (prefers active Live Activity, then cached storage, then fallback)
    public func getItems() -> [StudyActivityAttributes.ChecklistItemState] {
        if let liveItems = Activity<StudyActivityAttributes>.activities.first?.content.state.items, !liveItems.isEmpty {
            return liveItems
        }
        
        if let data = UserDefaults.standard.data(forKey: defaultsKey),
           let decoded = try? JSONDecoder().decode([StudyActivityAttributes.ChecklistItemState].self, from: data),
           !decoded.isEmpty {
            return decoded
        }
        
        return fallbackItems
    }
    
    /// Get current board & card title
    public func getTitles() -> (board: String, card: String) {
        if let live = Activity<StudyActivityAttributes>.activities.first {
            return (live.attributes.boardTitle, live.content.state.cardTitle)
        }
        let board = UserDefaults.standard.string(forKey: boardTitleKey) ?? "Minest 学习看板"
        let card = UserDefaults.standard.string(forKey: cardTitleKey) ?? "Core Subjects: Literacy & Math"
        return (board, card)
    }
    
    /// Save items into cache
    public func saveItems(_ items: [StudyActivityAttributes.ChecklistItemState], boardTitle: String? = nil, cardTitle: String? = nil) {
        if let encoded = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(encoded, forKey: defaultsKey)
        }
        if let board = boardTitle {
            UserDefaults.standard.set(board, forKey: boardTitleKey)
        }
        if let card = cardTitle {
            UserDefaults.standard.set(card, forKey: cardTitleKey)
        }
    }
    
    /// Toggle item state
    public func toggleItem(id: String) {
        var items = getItems()
        if let idx = items.firstIndex(where: { $0.id == id }) {
            items[idx].isDone.toggle()
        }
        saveItems(items)
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
            UserDefaults.standard.set(data, forKey: pendingCardsKey)
        }
    }
    
    private func getPendingCards() -> [[String: Any]] {
        guard let data = UserDefaults.standard.data(forKey: pendingCardsKey),
              let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return list
    }
    
    /// Retrieve and clear pending cards that were created by Siri while app was inactive
    public func consumePendingCards() -> [[String: Any]] {
        let list = getPendingCards()
        if !list.isEmpty {
            UserDefaults.standard.removeObject(forKey: pendingCardsKey)
        }
        return list
    }
}
