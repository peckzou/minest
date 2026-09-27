import ActivityKit
import Foundation

/// ActivityAttributes shared between Main App and Widget Extension (Dynamic Island).
public struct StudyActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var completedCount: Int       // e.g. 3 (checklist) or 7 (flashcard)
        public var totalCount: Int           // e.g. 5 (checklist) or 20 (flashcard)
        public var cardTitle: String         // e.g. "Learning Loop"
        public var itemText: String          // e.g. "Vocabulary Matrix"
        public var mode: String              // "checklist" or "flashcard"
        public var remainingMinutes: Int     // e.g. 12
        public var isAllDone: Bool           // true when all items completed
        
        public var progress: Double {
            guard totalCount > 0 else { return 0 }
            return min(max(Double(completedCount) / Double(totalCount), 0), 1.0)
        }
        
        // Backward-compatible computed aliases
        public var completedCards: Int { completedCount }
        public var totalCards: Int { totalCount }
        public var currentCardTitle: String { cardTitle }
        public var isPaused: Bool { false }
        
        public init(
            completedCount: Int,
            totalCount: Int,
            cardTitle: String,
            itemText: String = "",
            mode: String = "checklist",
            remainingMinutes: Int = 0,
            isAllDone: Bool = false
        ) {
            self.completedCount = completedCount
            self.totalCount = totalCount
            self.cardTitle = cardTitle
            self.itemText = itemText
            self.mode = mode
            self.remainingMinutes = remainingMinutes
            self.isAllDone = isAllDone
        }
        
        // Convenience initializer for flashcard drill
        public init(
            completedCards: Int,
            totalCards: Int,
            remainingMinutes: Int = 15,
            currentCardTitle: String = "",
            isPaused: Bool = false
        ) {
            self.completedCount = completedCards
            self.totalCount = totalCards
            self.cardTitle = currentCardTitle
            self.itemText = ""
            self.mode = "flashcard"
            self.remainingMinutes = remainingMinutes
            self.isAllDone = (completedCards >= totalCards && totalCards > 0)
        }
    }
    
    public var boardTitle: String
    public var sessionStartTime: Date
    
    public init(boardTitle: String = "Minest", sessionStartTime: Date = Date()) {
        self.boardTitle = boardTitle
        self.sessionStartTime = sessionStartTime
    }
}
