import Foundation
import WatchConnectivity
import WatchKit
import Combine

@MainActor
final class WatchPlaybackModel: ObservableObject {
    static let shared = WatchPlaybackModel()
    @Published private(set) var state: WatchPlaybackState?
    @Published private(set) var pending = false
    @Published private(set) var requesting = false
    @Published private(set) var message: String?
    private let cacheKey = "minest.watch.playback.snapshot.v1"
    private var timeout: Task<Void, Never>?
    private var requestTimeout: Task<Void, Never>?
    private var requestID: UUID?
    private var pendingID: String?
    private var lastRequest = Date.distantPast

    private init() {
        if let data = UserDefaults.standard.data(forKey: cacheKey) {
            state = try? JSONDecoder().decode(WatchPlaybackState.self, from: data)
        }
    }

    func apply(_ data: Data) {
        guard let incoming = try? JSONDecoder().decode(WatchPlaybackState.self, from: data), incoming.version == 1 else { return }
        guard state == nil || incoming.issuedAt >= state!.issuedAt else { return }
        state = incoming
        UserDefaults.standard.set(data, forKey: cacheKey)
    }

    func requestState(force: Bool = false) {
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable,
              !requesting, force || Date().timeIntervalSince(lastRequest) >= 5 else { return }
        requesting = true; lastRequest = Date()
        let id = UUID(); requestID = id
        requestTimeout?.cancel()
        requestTimeout = Task { [weak self] in
            try? await Task.sleep(for: .seconds(8))
            guard !Task.isCancelled, let self, self.requestID == id else { return }
            self.finishRequest(id, message: "同步超时，可重新同步手机")
        }
        WCSession.default.sendMessage(["action": "requestPlayback"], replyHandler: { reply in
            let data = reply["playback"] as? Data
            Task { @MainActor in
                guard self.requestID == id else { return }
                self.finishRequest(id, message: data == nil ? "手机尚未返回播放状态" : nil)
                if let data { self.apply(data) }
            }
        }, errorHandler: { _ in
            Task { @MainActor in
                self.finishRequest(id, message: "未能同步，请确认 iPhone 已连接")
            }
        })
    }

    private func finishRequest(_ id: UUID, message: String?) {
        guard requestID == id else { return }
        requestTimeout?.cancel(); requestTimeout = nil
        requestID = nil; requesting = false
        self.message = message
    }

    func favoriteCurrent() {
        guard let state, state.active,
              let id = state.cards[state.index()]?.cardID else {
            message = "正在同步卡片，请稍后重试"
            requestState(force: true)
            return
        }
        send(.setStarred, cardID: id, starred: true)
    }

    func next() { send(.next) }
    func setPaused(_ paused: Bool) { send(.setPaused, paused: paused) }

    private func send(_ operation: WatchPlaybackCommand.Operation, paused: Bool? = nil, cardID: String? = nil, starred: Bool? = nil) {
        guard let state, let sessionID = state.sessionID, state.active, !pending else { return }
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else {
            message = "iPhone 暂不可达；指令未发送"
            return
        }
        let command = WatchPlaybackCommand(id: UUID().uuidString, sessionID: sessionID,
                                           operation: operation, paused: paused, sentAt: Date(), cardID: cardID, starred: starred)
        guard let data = try? JSONEncoder().encode(command) else { return }
        pending = true; pendingID = command.id; message = nil
        timeout?.cancel()
        timeout = Task { [weak self] in
            try? await Task.sleep(for: .seconds(8))
            guard !Task.isCancelled, let self, self.pendingID == command.id else { return }
            self.finish(command.id, message: "手机未确认，请同步后重试")
            self.requestState(force: true)
        }
        // No applicationContext/transferUserInfo fallback: a delayed Next must never skip a later card.
        WCSession.default.sendMessage(["action": "playbackCommand", "payload": data], replyHandler: { reply in
            let data = reply["playbackReply"] as? Data
            Task { @MainActor in
                guard let data, let answer = try? JSONDecoder().decode(WatchPlaybackReply.self, from: data), answer.commandID == command.id else {
                    self.finish(command.id, message: "手机返回了无法识别的结果")
                    return
                }
                if let snapshot = try? JSONEncoder().encode(answer.state) { self.apply(snapshot) }
                guard self.pendingID == command.id else { return }
                self.finish(command.id, message: answer.message)
                WKInterfaceDevice.current().play(answer.accepted ? .click : .failure)
            }
        }, errorHandler: { _ in
            Task { @MainActor in self.finish(command.id, message: "连接中断，指令未确认") }
        })
    }

    private func finish(_ id: String, message: String?) {
        guard pendingID == id else { return }
        timeout?.cancel(); timeout = nil
        pendingID = nil; pending = false; self.message = message
    }
}
