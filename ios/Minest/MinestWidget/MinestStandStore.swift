import Foundation

// MARK: - Stand Mode snapshot (Octo Clock + My Collection)
//
// The web Stand Mode (tools/live-perf/stand.js) hands the app a small snapshot: four still Octo poses rendered from
// the Mini Pet's model, the clock preferences, the next study word and — only after the person said yes in Stand
// settings — up to six collection pieces (title, a small picture, a card link). The app writes it into the App Group
// as plain files; the StandBy widgets only read them. No account data, no tokens, nothing fetched by the widgets.
// The same file is in the app target (Minest/MinestStandStore.swift) and the widget target (MinestWidget/…).

public struct StandItem: Codable, Equatable {
    public var id: String
    public var title: String
    public var sub: String
    public var file: String?     // picture in the App Group's Stand folder
}

public struct StandMeta: Codable, Equatable {
    public var at: Double = 0
    public var clock: String = "minimal"   // minimal · aquarium · cozy
    public var fmt: String = "auto"        // auto · 12 · 24
    public var extra: String = "greeting"  // greeting · word · none
    public var word: String = ""
    public var show: String = "museum"     // museum · shelf · wall · mini
    public var octo: [String] = []         // poses with a picture
    public var items: [StandItem] = []     // empty unless StandBy was allowed in the app
}

public enum MinestStandStore {
    public static let suite = "group.com.zouminmin.minest"
    public static let clockKind = "MinestOctoClockWidget"
    public static let collectionKind = "MinestCollectionWidget"

    static var dir: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suite)?.appendingPathComponent("Stand", isDirectory: true)
    }

    public static func load() -> StandMeta? {
        guard let d = dir, let data = try? Data(contentsOf: d.appendingPathComponent("meta.json")) else { return nil }
        return try? JSONDecoder().decode(StandMeta.self, from: data)
    }

    public static func image(_ name: String?) -> Data? {
        guard let name, let d = dir else { return nil }
        return try? Data(contentsOf: d.appendingPathComponent(name))
    }

    /// Octo's pose for a time of day (or asleep when the Mini Pet is resting), as the web Stand Mode picks it.
    public static func pose(at date: Date) -> String {
        let h = Calendar.current.component(.hour, from: date)
        if h >= 22 || h < 6 { return "sleeping" }
        if h < 11 { return "happy" }
        if h < 17 { return "curious" }
        return "relaxing"
    }

    /// The hours at which the pose changes, after `date` (for the clock's timeline).
    public static func poseChanges(after date: Date, count: Int) -> [Date] {
        let cal = Calendar.current
        var out: [Date] = [], day = cal.startOfDay(for: date)
        while out.count < count {
            for h in [6, 11, 17, 22] {
                if let t = cal.date(byAdding: .hour, value: h, to: day), t > date { out.append(t); if out.count == count { break } }
            }
            day = cal.date(byAdding: .day, value: 1, to: day) ?? day.addingTimeInterval(86400)
        }
        return out
    }
}
