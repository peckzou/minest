import ActivityKit
import Foundation

/// ActivityAttributes shared between Main App and Widget Extension (Dynamic Island).
public struct StudyActivityAttributes: ActivityAttributes {
    
    public struct ChecklistItemState: Codable, Hashable, Identifiable {
        public var id: String
        public var text: String
        public var isDone: Bool
        
        public init(id: String, text: String, isDone: Bool = false) {
            self.id = id
            self.text = text
            self.isDone = isDone
        }
    }
    
    /// Live Three Rings snapshot (progress values come from Minest's own ring state; >1 = over goal)
    public struct RingsSnapshot: Codable, Hashable {
        public var focus: Double
        public var complete: Double
        public var goal: Double
        public var strikeDays: Int
        // Raw values for the expanded detail rows (optional: older payloads lack them)
        public var focusMinutes: Int?
        public var targetMinutes: Int?
        public var checkCount: Int?
        public var targetChecks: Int?
        public var goalPercent: Int?
        public var targetGoalPercent: Int?

        public init(focus: Double = 0, complete: Double = 0, goal: Double = 0, strikeDays: Int = 0) {
            self.focus = focus
            self.complete = complete
            self.goal = goal
            self.strikeDays = strikeDays
        }
    }

    /// Focus timer driven from the Dynamic Island (start / pause / stop)
    public struct FocusTimerState: Codable, Hashable {
        public var sessionId: String
        public var runningSince: Date?      // non-nil while running
        public var accumulated: Double      // seconds banked before the current run
        public var stoppedSeconds: Double?  // set on Stop; the app commits it to the Focus ring once

        public init(sessionId: String = UUID().uuidString, runningSince: Date? = nil, accumulated: Double = 0, stoppedSeconds: Double? = nil) {
            self.sessionId = sessionId
            self.runningSince = runningSince
            self.accumulated = accumulated
            self.stoppedSeconds = stoppedSeconds
        }

        public var isRunning: Bool { runningSince != nil }

        public func elapsed(at date: Date = Date()) -> Double {
            accumulated + (runningSince.map { date.timeIntervalSince($0) } ?? 0)
        }
    }

    public struct ContentState: Codable, Hashable {
        public var completedCount: Int       // e.g. 3 (checklist) or 7 (flashcard)
        public var totalCount: Int           // e.g. 5 (checklist) or 20 (flashcard)
        public var cardTitle: String         // e.g. "Learning Loop"
        public var itemText: String          // e.g. "Vocabulary Matrix"
        public var mode: String              // "checklist" or "flashcard"
        public var remainingMinutes: Int     // e.g. 12
        public var isAllDone: Bool           // true when all items completed
        public var items: [ChecklistItemState] // Interactive checklist items
        public var rings: RingsSnapshot?     // Optional so older activity payloads still decode
        public var timer: FocusTimerState?
        
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
            isAllDone: Bool = false,
            items: [ChecklistItemState] = []
        ) {
            self.completedCount = completedCount
            self.totalCount = totalCount
            self.cardTitle = cardTitle
            self.itemText = itemText
            self.mode = mode
            self.remainingMinutes = remainingMinutes
            self.isAllDone = isAllDone
            self.items = items
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
            self.items = []
        }
    }
    
    public var boardTitle: String
    public var sessionStartTime: Date
    
    public init(boardTitle: String = "Minest", sessionStartTime: Date = Date()) {
        self.boardTitle = boardTitle
        self.sessionStartTime = sessionStartTime
    }
}
