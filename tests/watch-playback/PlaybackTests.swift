import Foundation

@MainActor final class CarFlashController {
    static let shared = CarFlashController()
    var refreshes = 0
    func refreshFromWatch() { refreshes += 1 }
}
@MainActor final class iPhoneWatchSyncManager {
    static let shared = iPhoneWatchSyncManager()
    var published: Data?
    func sendPlaybackToWatch(_ data: Data) { published = data }
}

@main @MainActor struct PlaybackTests {
    static var count = 0
    static func check(_ condition: @autoclosure () throws -> Bool, _ name: String) {
        count += 1
        precondition(try! condition(), "FAILED: \(name)")
    }
    static func command(_ operation: WatchPlaybackCommand.Operation = .next,
                        session: String? = nil, paused: Bool? = nil, age: Double = 0,
                        id: String = UUID().uuidString) -> WatchPlaybackCommand {
        WatchPlaybackCommand(id: id, sessionID: session ?? CarFlashStore.load()!.playbackSessionID!,
                             operation: operation, paused: paused, sentAt: Date().addingTimeInterval(-age))
    }
    static func reply(_ command: WatchPlaybackCommand) throws -> WatchPlaybackReply {
        let data = WatchPlaybackCoordinator.shared.reply(to: try JSONEncoder().encode(command))!
        return try JSONDecoder().decode(WatchPlaybackReply.self, from: data)
    }
    static func main() throws {
        defer { UserDefaults(suiteName: CarFlashStore.suite)?.removePersistentDomain(forName: CarFlashStore.suite) }
        let coordinator = WatchPlaybackCoordinator.shared
        check(!coordinator.state().active, "stopped has no active timeline")
        let start = Date(timeIntervalSince1970: 1_000)
        var playlist = CarFlashPlaylist(words: ["one", "two", "three"], listName: "Demo", interval: 10,
                                       start: start, paused: false, pausedIndex: 0)
        // Legacy playlists have no session ID: decoding must remain backwards compatible.
        let legacy = try JSONEncoder().encode(playlist)
        check(try! JSONSerialization.jsonObject(with: legacy) is [String: Any], "legacy JSON")
        playlist = try JSONDecoder().decode(CarFlashPlaylist.self, from: legacy)
        check(playlist.playbackSessionID == nil, "optional identity backward compatibility")
        CarFlashStore.save(playlist)
        let first = coordinator.state(at: start)
        check(first.active && first.sessionID != nil, "legacy identity allocated once")
        check(first.sessionID == coordinator.state().sessionID, "identity stable across refresh")
        for durationCase in 0..<3 {
            playlist = CarFlashStore.load()!
            playlist.durations = durationCase == 0 ? nil : (durationCase == 1 ? [3, 11, 2] : [0, 0.5, 17])
            CarFlashStore.save(playlist)
            let state = coordinator.state(at: start)
            for tenth in -10..<900 {
                let date = start.addingTimeInterval(Double(tenth) / 10)
                check(state.index(at: date) == playlist.index(at: date), "phone/widget/watch timeline equality")
            }
        }
        playlist.paused = true; playlist.pausedIndex = 1
        CarFlashStore.save(playlist)
        let pausedState = coordinator.state(at: start)
        check(pausedState.index(at: start.addingTimeInterval(900)) == 1, "paused does not advance")
        let next = command()
        check(try reply(next).accepted, "Next accepted")
        check(CarFlashStore.load()!.pausedIndex == 2, "Next uses canonical store")
        check(CarFlashStore.load()!.paused, "Next retains pause")
        let refreshes = CarFlashController.shared.refreshes
        check(try reply(next).accepted, "duplicate returns acknowledgement")
        check(CarFlashStore.load()!.pausedIndex == 2 && CarFlashController.shared.refreshes == refreshes, "duplicate has no side effect")
        check(try reply(command()).state.index() == 0, "normal mode wraps")
        let before = CarFlashStore.load()!
        check(!(try reply(command(age: 60))).accepted, "stale rejected")
        check(!(try reply(command(age: -60))).accepted, "future-dated rejected")
        check(!(try reply(command(session: "another-session"))).accepted, "old playlist rejected")
        var unsupported = command(); unsupported.version = 2
        check(!(try reply(unsupported)).accepted, "future protocol rejected")
        check(CarFlashStore.load() == before, "rejected commands preserve canonical state")
        check((try reply(command(.setPaused, paused: false))).accepted, "resume acknowledged")
        check(!CarFlashStore.load()!.paused, "resume changes canonical pause")
        let resumed = CarFlashStore.load()!
        check((try reply(command(.setPaused, paused: false))).accepted, "repeat resume acknowledged")
        check(CarFlashStore.load() == resumed, "explicit resume idempotent")
        check((try reply(command(.setPaused, paused: true))).accepted, "pause acknowledged")
        check(CarFlashStore.load()!.paused, "pause changes canonical pause")
        check(!(try reply(command(.setPaused))).accepted, "missing desired pause rejected")
        playlist = CarFlashStore.load()!
        playlist.mode = "gpt"; playlist.position = 0; playlist.cardIds = ["c1", "c2", "c3"]
        playlist.seq = 0; playlist.events = []; playlist.playbackSessionID = "gpt-session"
        CarFlashStore.save(playlist)
        let gptNext = command()
        let gptReply = try reply(gptNext)
        check(gptReply.accepted && CarFlashStore.load()!.position == 1, "GPT advances persisted queue")
        check(CarFlashStore.load()!.events?.last?.cardId == "c2", "GPT logs existing progress event")
        _ = try reply(gptNext)
        check(CarFlashStore.load()!.seq == 1, "duplicate does not duplicate study progress")
        _ = try reply(command())
        check(!coordinator.state().canAdvance(), "GPT final card disables next")
        check(!(try reply(command())).accepted && CarFlashStore.load()!.position == 2, "GPT does not wrap")
        check(coordinator.state().index(at: Date().addingTimeInterval(900)) == 2, "GPT never extrapolates phone-only progress")
        let oldCommand = command()
        CarFlashStore.save(nil)
        check(!(try reply(oldCommand)).accepted && !coordinator.state().active, "stop invalidates controls")
        // Escaped text has a much larger JSON representation than its UTF-8 character count.
        playlist.words = (0..<500).map { _ in String(repeating: "\u{0001}", count: 600) }
        playlist.cardIds = nil; playlist.mode = nil; playlist.position = nil
        playlist.paused = true; playlist.pausedIndex = 400; playlist.durations = nil
        CarFlashStore.save(playlist)
        let limited = coordinator.state()
        let wire = try JSONEncoder().encode(limited)
        check(wire.count <= 45_000, "actual encoded WC payload stays bounded")
        check(limited.cards[400] != nil && limited.total == 500, "size cap retains current card and full timeline")
        let decoded = try JSONDecoder().decode(WatchPlaybackState.self, from: wire)
        check(decoded == limited, "wire round trip")
        coordinator.publish(force: true)
        check(iPhoneWatchSyncManager.shared.published != nil, "canonical snapshot published")
        print("PASS: \(count) assertions; production protocol, timeline, coordinator and store transitions")
        print("PASS: phone/watch protocol and phone/widget store copies identical")
    }
}
