import Foundation
#if canImport(WidgetKit)
import WidgetKit
#endif

// MARK: - Car flashcard playlist shared by the app and the widget extension (App Group)
//
// The CarPlay Dashboard widget (MinestCarFlashWidget) shows the words on a pre-built timeline, so the word keeps
// changing while Minest is suspended (phone locked in the car). Which word shows at a time is pure arithmetic:
// index = floor((now - start) / interval) % count. Pause keeps the index; Resume moves `start` so it continues there.
// GPT Study mode (mode "gpt"): no timer at all — the card at `position` stays until Next. The page sends the study queue
// (current card first, with stable card IDs); a Next from the widget or Siri moves `position` and is logged as a
// numbered event so the page can record it in the study progress when it next runs.
// 53.831: `durations` (one per card, from the page: reading time + 2 s ± the learner's 快慢) replace the fixed interval
// when set — Auto Play's 🧠 自动 — and drive GPT Study's ⏱ Auto (the app moves `position` when the card's time is up,
// `shownAt` = when it came). `starred` = card IDs the learner ★-ed (widget or phone); each ★ is logged as an event
// (kind "star" / "unstar") so the page records it. `tags` = "pron" / "meaning" per card (from ChatGPT's report).
// This file is compiled into BOTH the app and the widget extension (identical copies in Minest/ and MinestWidget/).

public struct CarFlashPlaylist: Codable, Equatable {
    public var words: [String]
    public var listName: String
    public var interval: Double          // seconds per word
    public var start: Date               // when index 0 showed (moved on Resume)
    public var paused: Bool
    public var pausedIndex: Int
    // GPT Study mode (all optional, so playlists saved by older builds still decode)
    public var mode: String?              // nil / "auto" = Auto Play · "gpt" = GPT Study
    public var listId: String?            // the page's list key
    public var cardIds: [String]?         // stable card IDs, parallel to `words`
    public var position: Int?             // GPT: the card on show
    public var seq: Int?                  // GPT: Next taps made outside the page
    public var events: [CarFlashEvent]?   // GPT: [seq, cardId] for each of them (and ★ taps in both modes)
    // 53.831 (optional too)
    public var durations: [Double]?       // seconds per card, parallel to `words`
    public var auto: Bool?                // GPT Study: ⏱ Auto
    public var shownAt: Date?             // GPT Study: when the card on show came
    public var starred: [String]?         // ★ card IDs
    public var tags: [String]?            // "pron" / "meaning" per card

    public var isGPT: Bool { mode == "gpt" }
    public var isTimed: Bool { !isGPT || auto == true }

    /// How long card i stays (its own duration, else the interval).
    public func duration(_ i: Int) -> Double {
        if let d = durations, d.count == words.count, i >= 0, i < d.count { return max(d[i], 1) }
        return max(interval, 1)
    }
    /// Seconds from card 0 to card i in one cycle.
    public func offset(_ i: Int) -> Double { (0..<max(0, min(i, words.count))).reduce(0) { $0 + duration($1) } }
    public var cycle: Double { offset(words.count) }

    public func index(at date: Date = Date()) -> Int {
        guard !words.isEmpty else { return 0 }
        if isGPT { return min(max(position ?? 0, 0), words.count - 1) }
        if paused { return min(max(pausedIndex, 0), words.count - 1) }
        let elapsed = max(0, date.timeIntervalSince(start))
        guard durations?.count == words.count else { return Int(floor(elapsed / max(interval, 1))) % words.count }
        var t = elapsed.truncatingRemainder(dividingBy: max(cycle, 1))
        for i in 0..<words.count { let d = duration(i); if t < d { return i }; t -= d }
        return words.count - 1
    }
    /// Auto Play: when the card on show at `date` gives way to the next one.
    public func nextChange(after date: Date) -> Date {
        let elapsed = max(0, date.timeIntervalSince(start)), c = max(cycle, 1)
        let base = floor(elapsed / c) * c, i = index(at: date)
        return start.addingTimeInterval(base + offset(i) + duration(i))
    }
    public func starredCard(at date: Date = Date()) -> Bool { guard let id = cardId(at: date) else { return false }; return (starred ?? []).contains(id) }
    public func tag(at date: Date = Date()) -> String { guard let t = tags, t.count == words.count else { return "" }; return t[index(at: date)] }

    public func word(at date: Date = Date()) -> String { words.isEmpty ? "" : words[index(at: date)] }
    public func cardId(at date: Date = Date()) -> String? {
        guard let ids = cardIds, !words.isEmpty, ids.count == words.count else { return nil }
        return ids[index(at: date)]
    }
}

public struct CarFlashEvent: Codable, Equatable {
    public var seq: Int
    public var cardId: String
    public var kind: String?   // nil = Next · "star" · "unstar"
}

public enum CarFlashStore {
    public static let suite = "group.com.zouminmin.minest"
    public static let key = "minest.carflash.playlist.v1"
    public static let widgetKind = "MinestCarFlashWidget"
    public static let darwinName = "com.zouminmin.minest.carflash.changed"

    public static func load() -> CarFlashPlaylist? {
        guard let data = UserDefaults(suiteName: suite)?.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(CarFlashPlaylist.self, from: data)
    }

    public static func save(_ playlist: CarFlashPlaylist?) {
        let d = UserDefaults(suiteName: suite)
        if let playlist, let data = try? JSONEncoder().encode(playlist) { d?.set(data, forKey: key) } else { d?.removeObject(forKey: key) }
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
        #endif
    }

    /// Next word now (and a full interval for it); paused stays paused on the next word.
    @discardableResult
    public static func next(at date: Date = Date()) -> Int? {
        guard var p = load(), !p.words.isEmpty else { return nil }
        if p.isGPT {
            // GPT Study: one step along the queue, never past its end, logged for the page's progress
            let from = p.index(at: date), i = min(from + 1, p.words.count - 1)
            if i != from {
                p.position = i
                p.shownAt = date
                let n = (p.seq ?? 0) + 1
                p.seq = n
                if let id = p.cardId(at: date) { p.events = Array(((p.events ?? []) + [CarFlashEvent(seq: n, cardId: id, kind: nil)]).suffix(200)) }
            }
            save(p)
            CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), CFNotificationName(darwinName as CFString), nil, nil, true)
            return i
        }
        let i = (p.index(at: date) + 1) % p.words.count
        if p.paused { p.pausedIndex = i } else { p.start = date.addingTimeInterval(-p.offset(i)) }
        save(p)
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), CFNotificationName(darwinName as CFString), nil, nil, true)
        return i
    }

    /// ★ the card on show (or un-★ it); logged for the page, which keeps it in the list's study progress.
    @discardableResult
    public static func star(at date: Date = Date()) -> Bool? {
        guard var p = load(), !p.words.isEmpty, let id = p.cardId(at: date) else { return nil }
        var s = p.starred ?? []
        let on = !s.contains(id)
        if on { s.append(id) } else { s.removeAll { $0 == id } }
        p.starred = s
        let n = (p.seq ?? 0) + 1
        p.seq = n
        p.events = Array(((p.events ?? []) + [CarFlashEvent(seq: n, cardId: id, kind: on ? "star" : "unstar")]).suffix(200))
        save(p)
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), CFNotificationName(darwinName as CFString), nil, nil, true)
        return on
    }

    /// Pause ↔ Resume on the stored playlist; returns the new paused state (nil when nothing plays).
    @discardableResult
    public static func toggle(at date: Date = Date()) -> Bool? {
        guard var p = load(), !p.words.isEmpty else { return nil }
        if p.isGPT {
            p.paused.toggle()   // GPT Study: Pause stops ⏱ Auto; Resume gives the card its full time again
            if !p.paused { p.shownAt = date }
        } else if p.paused {
            p.paused = false
            p.start = date.addingTimeInterval(-p.offset(p.pausedIndex))
        } else {
            p.pausedIndex = p.index(at: date)
            p.paused = true
        }
        save(p)
        // tell a running Minest app (it keeps the Live Activity and the phone panel in step)
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), CFNotificationName(darwinName as CFString), nil, nil, true)
        return p.paused
    }
}
