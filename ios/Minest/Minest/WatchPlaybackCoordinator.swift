import Foundation

/// Commands are live request/reply only. Never queue Next/Toggle for delayed delivery.
@MainActor
public final class WatchPlaybackCoordinator {
    public static let shared = WatchPlaybackCoordinator()
    private var outcomes: [String: (accepted: Bool, message: String?)] = [:]
    private var commandOrder: [String] = []
    private var lastContent: Data?
    private var lastPush = Date.distantPast
    private init() {}

    public func state(at now: Date = Date()) -> WatchPlaybackState {
        var state = WatchPlaybackState()
        state.issuedAt = now
        guard var p = CarFlashStore.load(), !p.words.isEmpty else { return state }
        if p.playbackSessionID == nil {
            p.playbackSessionID = UUID().uuidString
            CarFlashStore.save(p)
        }
        state.sessionID = p.playbackSessionID
        state.listName = String(p.listName.prefix(160))
        state.total = p.words.count
        state.starred = p.starred
        state.durations = p.words.indices.map { p.duration($0) }
        state.start = p.start
        state.paused = p.paused
        state.pausedIndex = p.index(at: now)
        state.isGPT = p.isGPT
        state.position = p.index(at: now)
        // Put the current card first, followed by future cards. Keep WCSession well under its size limit.
        let index = p.index(at: now)
        var budget = 2_000 + state.durations.count * 24
        for offset in 0..<p.words.count {
            let i = (index + offset) % p.words.count
            let id = p.cardIds.flatMap { $0.indices.contains(i) ? $0[i] : nil }
            let text = String(p.words[i].prefix(600))
            budget += text.utf8.count * 2 + (id?.utf8.count ?? 0) * 2 + 128
            if budget > 40_000 && !state.cards.isEmpty { break }
            state.cards[i] = WatchPlaybackCard(text: text, cardID: id)
        }
        // Enforce the encoded limit too (JSON can escape control characters at 6 bytes each).
        // Keep the timeline intact and prioritize the card currently on screen.
        let encoder = JSONEncoder()
        var removeOffset = state.cards.count - 1
        while ((try? encoder.encode(state).count) ?? Int.max) > 45_000, removeOffset > 0 {
            state.cards.removeValue(forKey: (index + removeOffset) % p.words.count)
            removeOffset -= 1
        }
        return state
    }

    public func publish(force: Bool = false) {
        let state = state()
        var content = state
        content.issuedAt = .distantPast
        guard let identity = try? JSONEncoder().encode(content) else { return }
        // sortedKeys also makes dictionary comparisons independent of iteration order.
        let encoder = JSONEncoder(); encoder.outputFormatting = .sortedKeys
        let stable = (try? encoder.encode(content)) ?? identity
        guard force || stable != lastContent || Date().timeIntervalSince(lastPush) > 30 else { return }
        lastContent = stable; lastPush = Date()
        guard let data = try? encoder.encode(state) else { return }
        iPhoneWatchSyncManager.shared.sendPlaybackToWatch(data)
    }

    public func reply(to data: Data?) -> Data? {
        let encoder = JSONEncoder()
        guard let data, let command = try? JSONDecoder().decode(WatchPlaybackCommand.self, from: data) else {
            return try? encoder.encode(WatchPlaybackReply(commandID: nil, accepted: false, message: "无法识别播放指令", state: state()))
        }
        if let previous = outcomes[command.id] {
            return try? encoder.encode(WatchPlaybackReply(commandID: command.id, accepted: previous.accepted, message: previous.message, state: state()))
        }
        var accepted = false
        var message: String?
        let current = state()
        if command.version != 1 { message = "请更新手机与手表 App" }
        else if !command.isFresh(at: Date()) { message = "指令已过期，请重试" }
        else if !current.active || command.sessionID != current.sessionID { message = "手机播放内容已改变，请同步后重试" }
        else {
            switch command.operation {
            case .next:
                if current.canAdvance() {
                    accepted = CarFlashStore.next() != nil
                } else { message = "已经是最后一张" }
            case .setStarred:
                if let id = command.cardID, let desired = command.starred,
                   CarFlashStore.setStarred(cardID: id, desired: desired) != nil {
                    accepted = true
                    message = desired ? "已收藏 ★" : "已取消收藏"
                } else { message = "这张卡片没有可用的收藏标识" }
            case .setPaused:
                if let desired = command.paused {
                    if current.paused != desired { _ = CarFlashStore.toggle() }
                    accepted = true
                } else { message = "缺少播放状态" }
            }
            if accepted { CarFlashController.shared.refreshFromWatch() }
        }
        outcomes[command.id] = (accepted, message)
        commandOrder.append(command.id)
        if commandOrder.count > 128 { outcomes.removeValue(forKey: commandOrder.removeFirst()) }
        publish(force: true)
        return try? encoder.encode(WatchPlaybackReply(commandID: command.id, accepted: accepted, message: message, state: state()))
    }
}
