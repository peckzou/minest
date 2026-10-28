import Foundation

/// A read-only projection of the iPhone's canonical CarFlashStore, never a second player.
public struct WatchPlaybackCard: Codable, Equatable, Sendable {
    public var text: String
    public var cardID: String?
}

public struct WatchPlaybackState: Codable, Equatable, Sendable {
    public var version = 1
    public var issuedAt = Date()
    public var sessionID: String?
    public var listName = ""
    public var total = 0
    public var cards: [Int: WatchPlaybackCard] = [:]
    public var durations: [Double] = []
    public var start = Date()
    public var paused = false
    public var pausedIndex = 0
    public var isGPT = false
    public var position = 0
    public var starred: [String]?

    public var active: Bool { sessionID != nil && total > 0 }
    public func index(at date: Date = Date()) -> Int {
        guard active else { return 0 }
        if isGPT { return min(max(position, 0), total - 1) }
        if paused { return min(max(pausedIndex, 0), total - 1) }
        guard durations.count == total else { return min(max(pausedIndex, 0), total - 1) }
        let cycle = durations.reduce(0) { $0 + max($1, 1) }
        var elapsed = max(0, date.timeIntervalSince(start)).truncatingRemainder(dividingBy: max(cycle, 1))
        for (i, d) in durations.enumerated() {
            let duration = max(d, 1)
            if elapsed < duration { return i }
            elapsed -= duration
        }
        return total - 1
    }
    public func canAdvance(at date: Date = Date()) -> Bool {
        active && total > 1 && (!isGPT || index(at: date) < total - 1)
    }
}

public struct WatchPlaybackCommand: Codable, Equatable, Sendable {
    public enum Operation: String, Codable, Sendable { case next, setPaused, setStarred }
    public var version = 1
    public var id: String
    public var sessionID: String
    public var operation: Operation
    public var paused: Bool?
    public var sentAt: Date
    public var cardID: String? = nil
    public var starred: Bool? = nil
    public func isFresh(at now: Date) -> Bool {
        let age = now.timeIntervalSince(sentAt)
        return age >= -30 && age <= 5
    }
}

public struct WatchPlaybackReply: Codable, Sendable {
    public var commandID: String?
    public var accepted: Bool
    public var message: String?
    public var state: WatchPlaybackState
}
