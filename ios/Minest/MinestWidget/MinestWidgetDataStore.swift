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
        var items = getItems()
        if let idx = items.firstIndex(where: { $0.id == id }) {
            items[idx].isDone.toggle()
        }
        saveItems(items)
    }
}
