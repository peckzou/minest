import Foundation
import WidgetKit

// MARK: - Stand Mode · the app's side
//
// The page posts { action: "standSnapshot", snapshot: "<json>" } (tools/live-perf/stand.js) whenever Stand Mode's
// settings or chosen pieces change, and "" on sign-out / another account. Written into the App Group for the
// StandBy widgets (MinestWidget/MinestStandWidgets.swift); the widgets are then asked to reload.

enum StandController {
    /// true when the bridge action was Stand Mode's (MinestBridge.handleAction asks first).
    static func handle(_ action: String, data: [String: Any]) -> Bool {
        guard action == "standSnapshot" else { return false }
        let json = data["snapshot"] as? String ?? ""
        DispatchQueue.global(qos: .utility).async { MinestStandStore.save(json: json) }
        return true
    }
}

extension MinestStandStore {
    /// Write the page's snapshot (JSON with data: URLs). An empty string clears everything (sign-out, StandBy turned off by a new account…).
    public static func save(json: String) {
        guard let d = dir else { return }
        let fm = FileManager.default
        try? fm.removeItem(at: d)
        defer { reload() }
        guard !json.isEmpty, let raw = json.data(using: .utf8),
              let o = (try? JSONSerialization.jsonObject(with: raw)) as? [String: Any] else { return }
        try? fm.createDirectory(at: d, withIntermediateDirectories: true)
        var m = StandMeta()
        m.at = o["at"] as? Double ?? Date().timeIntervalSince1970 * 1000
        m.clock = o["clock"] as? String ?? "minimal"
        m.fmt = o["fmt"] as? String ?? "auto"
        m.extra = o["extra"] as? String ?? "greeting"
        m.word = String((o["word"] as? String ?? "").prefix(60))
        m.show = o["show"] as? String ?? "museum"
        for (pose, url) in (o["octo"] as? [String: String] ?? [:]) where ["happy", "sleeping", "curious", "relaxing"].contains(pose) {
            if let data = decode(url) { try? data.write(to: d.appendingPathComponent("octo-\(pose).img")); m.octo.append(pose) }
        }
        for (i, it) in ((o["items"] as? [[String: Any]]) ?? []).prefix(6).enumerated() {
            var item = StandItem(id: it["id"] as? String ?? "", title: String((it["title"] as? String ?? "").prefix(80)), sub: String((it["sub"] as? String ?? "").prefix(80)), file: nil)
            if let data = decode(it["img"] as? String ?? "") { let f = "item-\(i).img"; try? data.write(to: d.appendingPathComponent(f)); item.file = f }
            m.items.append(item)
        }
        if let data = try? JSONEncoder().encode(m) { try? data.write(to: d.appendingPathComponent("meta.json")) }
    }

    private static func decode(_ url: String) -> Data? {
        guard url.hasPrefix("data:image/"), let comma = url.firstIndex(of: ",") else { return nil }
        let data = Data(base64Encoded: String(url[url.index(after: comma)...]))
        return (data?.count ?? 0) < 1_500_000 ? data : nil   // small pictures only
    }

    static func reload() {
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadTimelines(ofKind: clockKind)
        WidgetCenter.shared.reloadTimelines(ofKind: collectionKind)
        #endif
    }
}
