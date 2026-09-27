import ActivityKit
import Foundation

/// Shared Live Activity Attributes between FocusIsland App and FocusIslandWidget Extension
public struct FocusActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var title: String
        public var completed: Int
        public var total: Int
        
        public init(title: String = "English / EC-6", completed: Int = 0, total: Int = 20) {
            self.title = title
            self.completed = completed
            self.total = total
        }
    }
    
    public var sessionName: String
    
    public init(sessionName: String = "Focusboard") {
        self.sessionName = sessionName
    }
}
