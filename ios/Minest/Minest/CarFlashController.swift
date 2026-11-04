import ActivityKit
import Foundation
import UIKit

// MARK: - Car flashcard (CarPlay Dashboard)
//
// The web page picks a list and an interval and sends:
//   carFlashStart  { words: [String], listName, interval (s), shuffle }
//   carFlashToggle {}   ·   carFlashStop {}   ·   carFlashState {}
// The playlist is stored in the App Group (CarFlashStore). Two things show it:
//   · the CarPlay Dashboard widget (MinestCarFlashWidget): a pre-built timeline, so the word keeps changing while
//     Minest is suspended (the phone is locked in the car) — its round button pauses / resumes;
//   · the Live Activity (mode "carflash"): Lock Screen, Dynamic Island and, on iOS 26+, CarPlay too. It is only
//     updated while Minest runs, so the controller re-sends the current word on a timer while the app is open.
// The word at a moment is arithmetic on the stored playlist, so every surface agrees on it.
// 53.831: carFlashStart may carry durations (per card), cardIds + listKey (Auto Play too), tags, starred, and auto (GPT
// Study ⏱ Auto: this controller's timer moves the card when its time is up — the phone stays awake while it plays);
// carFlashStar {} ★-s the card on show (the widget's ★ does the same in its own process).

@MainActor
public final class CarFlashController {
    public static let shared = CarFlashController()

    private weak var bridge: MinestBridge?
    private var playlist: CarFlashPlaylist?
    private var lastIndex = -1
    private var timer: Timer?
    private var restoreMode: String?      // the activity's mode before car flash took it over
    private var ownsActivity = false      // we started the activity, so Stop ends it
    private var playing: Bool { !(playlist?.words.isEmpty ?? true) }
    private var paused: Bool { playlist?.paused ?? false }

    private init() {
        playlist = CarFlashStore.load()   // a playlist from an earlier run (the widget may still be playing it)
        NotificationCenter.default.addObserver(forName: .minestCarFlashToggled, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sync() }
        }
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sync() }
        }
        // the widget's button (another process) changed the playlist
        let observer = Unmanaged.passUnretained(self).toOpaque()
        CFNotificationCenterAddObserver(CFNotificationCenterGetDarwinNotifyCenter(), observer, { _, _, _, _, _ in
            DispatchQueue.main.async { NotificationCenter.default.post(name: .minestCarFlashToggled, object: nil) }
        }, CarFlashStore.darwinName as CFString, nil, .deliverImmediately)
        if playing { schedule() }
    }

    /// Returns true when the action was a car-flash action.
    public func handle(_ action: String, data: [String: Any], bridge: MinestBridge) -> Bool {
        switch action {
        case "carFlashStart":
            self.bridge = bridge
            let raw = (data["words"] as? [Any] ?? []).compactMap { $0 as? String }
            let list = raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
            let seconds = (data["interval"] as? NSNumber)?.doubleValue ?? 10
            let ids = (data["cardIds"] as? [Any] ?? []).map { "\($0)" }
            let extra = Extra(durations: (data["durations"] as? [Any])?.compactMap { ($0 as? NSNumber)?.doubleValue },
                              tags: (data["tags"] as? [Any])?.map { "\($0)" }, starred: (data["starred"] as? [Any])?.map { "\($0)" },
                              auto: data["auto"] as? Bool ?? false)
            if (data["mode"] as? String) == "gpt" {
                startGPT(words: raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }, cardIds: ids,
                         listName: data["listName"] as? String ?? "", listId: data["listKey"] as? String ?? "", extra: extra)
            } else if ids.count == raw.count {   // 53.831 page: words in their final order, with their card IDs
                start(words: raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }, listName: data["listName"] as? String ?? "",
                      interval: seconds, cardIds: ids, listId: data["listKey"] as? String, extra: extra)
            } else {
                start(words: (data["shuffle"] as? Bool ?? false) ? list.shuffled() : list,
                      listName: data["listName"] as? String ?? "",
                      interval: seconds)
            }
        case "carFlashToggle":
            self.bridge = bridge
            if playing { CarFlashStore.toggle() }   // posts the Darwin note → sync()
            sync()
        case "carFlashNext":
            self.bridge = bridge
            if playing { CarFlashStore.next() }
            sync()
        case "carFlashStar":
            self.bridge = bridge
            if playing { CarFlashStore.star() }
            sync()
        case "carFlashStop":
            self.bridge = bridge
            stop()
        case "carFlashState":
            self.bridge = bridge
            sync()
        default:
            return false
        }
        return true
    }

    // MARK: play / pause / stop

    struct Extra { var durations: [Double]?; var tags: [String]?; var starred: [String]?; var auto: Bool }
    private func fit<T>(_ a: [T]?, _ n: Int) -> [T]? { guard let a, a.count >= n else { return nil }; return Array(a.prefix(n)) }

    private func start(words list: [String], listName name: String, interval seconds: Double, cardIds: [String]? = nil, listId: String? = nil, extra: Extra? = nil) {
        guard !list.isEmpty else { notifyWeb(error: "这个词表没有可以显示的词。"); return }
        let words = Array(list.prefix(500)), n = words.count
        var p = CarFlashPlaylist(words: words, listName: name, interval: min(max(seconds, 3), 120),
                                 start: Date(), paused: false, pausedIndex: 0)
        p.cardIds = fit(cardIds, n); p.listId = listId; p.seq = 0; p.events = []
        p.durations = fit(extra?.durations, n)?.map { min(max($0, 1), 120) }; p.tags = fit(extra?.tags, n); p.starred = extra?.starred
        CarFlashStore.save(p)
        playlist = p
        lastIndex = -1
        UIApplication.shared.isIdleTimerDisabled = true
        schedule()
        if ActivityAuthorizationInfo().areActivitiesEnabled { Task { await self.push() } }
        notifyWeb()
    }

    /// GPT Study: the page sends the study queue (current card first); the card stays until Next.
    private func startGPT(words list: [String], cardIds: [String], listName name: String, listId: String, extra: Extra? = nil) {
        guard !list.isEmpty, cardIds.count == list.count else { notifyWeb(error: "这个词表没有可以显示的词。"); return }
        let n = min(list.count, 500)
        var p = CarFlashPlaylist(words: Array(list.prefix(500)), listName: name, interval: 10, start: Date(), paused: false, pausedIndex: 0,
                                 mode: "gpt", listId: listId, cardIds: Array(cardIds.prefix(500)), position: 0, seq: 0, events: [])
        p.auto = extra?.auto ?? false; p.shownAt = Date()
        p.durations = fit(extra?.durations, n)?.map { min(max($0, 1), 120) }; p.tags = fit(extra?.tags, n); p.starred = extra?.starred
        CarFlashStore.save(p)
        playlist = p
        lastIndex = -1
        UIApplication.shared.isIdleTimerDisabled = true
        schedule()
        if ActivityAuthorizationInfo().areActivitiesEnabled { Task { await self.push() } }
        notifyWeb()
    }

    /// Re-read the stored playlist (after a toggle from the widget, the Live Activity, Siri or the page).
    private func sync() {
        playlist = CarFlashStore.load()
        guard playing else { notifyWeb(); return }
        schedule()
        Task { await self.push() }
        notifyWeb()
    }

    private func stop() {
        guard playing else { notifyWeb(); return }
        timer?.invalidate(); timer = nil
        CarFlashStore.save(nil)
        playlist = nil
        UIApplication.shared.isIdleTimerDisabled = false
        let owned = ownsActivity, mode = restoreMode
        ownsActivity = false; restoreMode = nil
        Task {
            for activity in Activity<StudyActivityAttributes>.activities where activity.activityState == .active {
                if owned {
                    await activity.end(nil, dismissalPolicy: .immediate)
                } else {
                    var state = activity.content.state
                    state.carFlash = nil
                    state.mode = mode ?? "checklist"
                    await activity.update(ActivityContent(state: state, staleDate: nil))
                }
            }
        }
        notifyWeb()
    }

    /// While the app runs: check once a second whether the word changed, and send it to the Live Activity + page.
    private func schedule() {
        timer?.invalidate(); timer = nil
        guard playing, !paused, playlist?.isTimed ?? false else { return }   // GPT Study runs one only in ⏱ Auto
        let t = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    private func tick() {
        guard let p = playlist, playing, !p.paused else { return }
        if p.isGPT {   // ⏱ Auto: the card's time is up → Next (logged for the page, like a widget Next); the last card stays
            let i = p.index(), since = Date().timeIntervalSince(p.shownAt ?? p.start)
            if since >= p.duration(i), i < p.words.count - 1 { CarFlashStore.next(); sync() }
            return
        }
        let i = p.index()
        guard i != lastIndex else { return }
        Task { await self.push() }
        notifyWeb()
    }

    // MARK: Live Activity

    private var flashState: StudyActivityAttributes.CarFlashState? {
        guard let p = playlist, !p.words.isEmpty else { return nil }
        let i = p.index()
        return StudyActivityAttributes.CarFlashState(word: p.words[i], index: i, total: p.words.count,
                                                     paused: p.paused, listName: p.listName, interval: Int(p.interval))
    }

    /// Every place that builds a new ContentState (LiveActivityManager: list updates, study progress, a new study session)
    /// calls this, so a playing card is never replaced by the rings — and a card nothing plays any more goes away.
    public func apply(to state: inout StudyActivityAttributes.ContentState) {
        if let flash = flashState {
            state.carFlash = flash
            state.mode = "carflash"
        } else if state.carFlash != nil || state.mode == "carflash" {
            state.carFlash = nil
            if state.mode == "carflash" { state.mode = "checklist" }
        }
    }

    /// Writes the current word into the active Live Activity; if something ended it, a new one is started.
    private func push() async {
        guard let flash = flashState, ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        lastIndex = flash.index
        if let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }) {
            var state = activity.content.state
            if state.carFlash == nil, restoreMode == nil { restoreMode = state.mode }
            state.mode = "carflash"
            state.carFlash = flash
            await activity.update(ActivityContent(state: state, staleDate: nil))
            return
        }
        var state = StudyActivityAttributes.ContentState(completedCount: 0, totalCount: flash.total, cardTitle: flash.listName,
                                                         itemText: flash.listName, mode: "carflash")
        state.rings = LiveActivityManager.shared.latestRings
        state.carFlash = flash
        do {
            _ = try Activity.request(attributes: StudyActivityAttributes(boardTitle: flash.listName.isEmpty ? "Minest" : flash.listName),
                                     content: ActivityContent(state: state, staleDate: nil), pushType: nil)
            ownsActivity = true
            restoreMode = nil
        } catch {
            notifyWeb(error: "无法启动实时活动：\(error.localizedDescription)")
        }
    }

    // MARK: web page

    private func notifyWeb(error: String? = nil) {
        let f = flashState
        var payload: [String: Any] = [
            "playing": playing,
            "paused": paused,
            "word": f?.word ?? "",
            "index": f?.index ?? 0,
            "total": f?.total ?? 0,
            "listName": playlist?.listName ?? "",
            "interval": Int(playlist?.interval ?? 10),
            "mode": playlist?.isGPT == true ? "gpt" : "auto",
            "listKey": playlist?.listId ?? "",
            "cardId": playlist?.cardId() ?? "",
            "seq": playlist?.seq ?? 0,
            "events": (playlist?.events ?? []).map { [$0.seq, $0.cardId, $0.kind ?? "next"] as [Any] },
            "auto": playlist?.auto ?? false
        ]
        if let error { payload["error"] = error }
        bridge?.sendEventToWeb(event: "carFlash", payload: payload)
    }
}
