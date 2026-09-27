import Foundation
import CoreSpotlight
import UniformTypeIdentifiers

/// Manages system-wide iOS Spotlight indexing for Minest boards and cards
public final class NativeSpotlightManager {
    public static let shared = NativeSpotlightManager()
    
    public static let cardDomainIdentifier = "com.zouminmin.minest.cards"
    public static let boardDomainIdentifier = "com.zouminmin.minest.boards"
    
    private init() {}
    
    /// Index a batch of cards into iOS Spotlight
    public func indexCards(_ cards: [[String: Any]]) {
        var searchableItems: [CSSearchableItem] = []
        
        for card in cards {
            guard let id = card["id"] as? String ?? (card["cardId"] as? String),
                  let title = card["title"] as? String ?? (card["cardTitle"] as? String),
                  !title.isEmpty else {
                continue
            }
            
            let attributeSet = CSSearchableItemAttributeSet(contentType: .content)
            attributeSet.title = title
            
            if let desc = card["description"] as? String, !desc.isEmpty {
                attributeSet.contentDescription = desc
            } else if let items = card["items"] as? [String] {
                attributeSet.contentDescription = items.joined(separator: " • ")
            } else if let boardTitle = card["boardTitle"] as? String {
                attributeSet.contentDescription = "看板：\(boardTitle)"
            }
            
            var keywords = ["Minest", "Focusboard", "Card", title]
            if let boardTitle = card["boardTitle"] as? String {
                keywords.append(boardTitle)
            }
            if let tags = card["tags"] as? [String] {
                keywords.append(contentsOf: tags)
            }
            attributeSet.keywords = keywords
            
            let item = CSSearchableItem(
                uniqueIdentifier: "minest-card-\(id)",
                domainIdentifier: Self.cardDomainIdentifier,
                attributeSet: attributeSet
            )
            item.expirationDate = Date.distantFuture
            searchableItems.append(item)
        }
        
        guard !searchableItems.isEmpty else { return }
        
        CSSearchableIndex.default().indexSearchableItems(searchableItems) { error in
            if let error = error {
                print("❌ [NativeSpotlightManager] Error indexing \(searchableItems.count) cards: \(error.localizedDescription)")
            } else {
                print("🔍 [NativeSpotlightManager] Successfully indexed \(searchableItems.count) cards to iOS Spotlight")
            }
        }
    }
    
    /// Delete a single card from Spotlight
    public func deleteCard(id: String) {
        let identifier = id.hasPrefix("minest-card-") ? id : "minest-card-\(id)"
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: [identifier]) { error in
            if let error = error {
                print("❌ [NativeSpotlightManager] Failed to delete card from Spotlight: \(error.localizedDescription)")
            } else {
                print("🗑️ [NativeSpotlightManager] Deleted card \(id) from Spotlight")
            }
        }
    }
    
    /// Clear all indexed cards from Spotlight
    public func clearAll() {
        CSSearchableIndex.default().deleteSearchableItems(withDomainIdentifiers: [Self.cardDomainIdentifier, Self.boardDomainIdentifier]) { error in
            if let error = error {
                print("❌ [NativeSpotlightManager] Failed to clear Spotlight index: \(error.localizedDescription)")
            } else {
                print("🧹 [NativeSpotlightManager] Cleared all Minest items from Spotlight")
            }
        }
    }
}
