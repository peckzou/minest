import Foundation
import Network

/// Local link to the Minest web page open in the Mac browser (ws://127.0.0.1:47321/minest).
/// The page sends what its Mini Pet does (so the desktop pet does the same), its outfit, held badge
/// and tips; the desktop pet sends its bubble commands back. Loopback only; browser pages from other
/// sites are refused by their Origin.
final class LinkServer {
    static let port: UInt16 = 47321

    /// a JSON message from the page (already validated as JSON)
    var onMessage: ((String) -> Void)?
    /// connected or not, and the browser's user agent (to bring the right browser forward)
    var onStatus: ((Bool, String?) -> Void)?

    private var listener: NWListener?
    private var connections: [ObjectIdentifier: NWConnection] = [:]
    private var lastActive: NWConnection?
    private(set) var userAgent: String?

    var isConnected: Bool { return !connections.isEmpty }

    private static let allowedHosts = ["minest-app.vercel.app", "focusboard-drab.vercel.app", "localhost", "127.0.0.1"]

    static func originAllowed(_ origin: String?) -> Bool {
        // no Origin = a local program (not a web page); "null" = a file:// page
        guard let origin = origin, !origin.isEmpty, origin != "null" else { return true }
        guard let host = URL(string: origin)?.host?.lowercased() else { return false }
        return allowedHosts.contains(host) || host.hasSuffix(".localhost")
    }

    func start() {
        let ws = NWProtocolWebSocket.Options()
        ws.autoReplyPing = true
        ws.maximumMessageSize = 1 << 20
        ws.setClientRequestHandler(.main) { _, headers in
            let origin = headers.first { $0.name.lowercased() == "origin" }?.value
            if LinkServer.originAllowed(origin) {
                return NWProtocolWebSocket.Response(status: .accept, subprotocol: nil)
            }
            print("🔒 [Link] refused origin \(origin ?? "-")")
            return NWProtocolWebSocket.Response(status: .reject, subprotocol: nil)
        }
        let params = NWParameters.tcp
        params.defaultProtocolStack.applicationProtocols.insert(ws, at: 0)
        params.requiredInterfaceType = .loopback
        params.allowLocalEndpointReuse = true
        // bound to 127.0.0.1 only: nothing on the network can reach it
        params.requiredLocalEndpoint = NWEndpoint.hostPort(host: "127.0.0.1", port: NWEndpoint.Port(rawValue: LinkServer.port)!)
        do {
            let l = try NWListener(using: params)
            l.newConnectionHandler = { [weak self] conn in self?.accept(conn) }
            l.stateUpdateHandler = { state in
                switch state {
                case .ready: print("🔗 [Link] listening on 127.0.0.1:\(LinkServer.port)")
                case .failed(let err): print("⚠️ [Link] listener failed: \(err)")
                default: break
                }
            }
            l.start(queue: .main)
            listener = l
        } catch {
            print("⚠️ [Link] could not start: \(error)")
        }
    }

    private func accept(_ conn: NWConnection) {
        let id = ObjectIdentifier(conn)
        connections[id] = conn
        conn.stateUpdateHandler = { [weak self, weak conn] state in
            guard let self = self, let conn = conn else { return }
            switch state {
            case .ready:
                self.lastActive = conn
                self.send(["t": "hello", "app": "MinestDesktopPet"], to: conn)
                self.onStatus?(true, self.userAgent)
            case .failed, .cancelled:
                self.drop(conn)
            default: break
            }
        }
        conn.start(queue: .main)
        receive(on: conn)
    }

    private func drop(_ conn: NWConnection) {
        let id = ObjectIdentifier(conn)
        guard connections[id] != nil else { return }
        connections.removeValue(forKey: id)
        if lastActive === conn { lastActive = connections.values.first }
        conn.cancel()
        onStatus?(isConnected, userAgent)
    }

    private func receive(on conn: NWConnection) {
        conn.receiveMessage { [weak self, weak conn] data, _, _, error in
            guard let self = self, let conn = conn else { return }
            if let data = data, !data.isEmpty,
               let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let clean = try? JSONSerialization.data(withJSONObject: obj),
               let text = String(data: clean, encoding: .utf8) {
                self.lastActive = conn
                if obj["t"] as? String == "hello" { self.userAgent = obj["ua"] as? String; self.onStatus?(true, self.userAgent) }
                if obj["t"] as? String == "focus", obj["visible"] as? Bool == true { self.lastActive = conn }
                self.onMessage?(text)
            }
            if error == nil { self.receive(on: conn) } else { self.drop(conn) }
        }
    }

    /// to the page that was active last
    @discardableResult
    func send(_ obj: [String: Any], to target: NWConnection? = nil) -> Bool {
        guard let conn = target ?? lastActive,
              let data = try? JSONSerialization.data(withJSONObject: obj) else { return false }
        let meta = NWProtocolWebSocket.Metadata(opcode: .text)
        let ctx = NWConnection.ContentContext(identifier: "minest", metadata: [meta])
        conn.send(content: data, contentContext: ctx, isComplete: true, completion: .contentProcessed { _ in })
        return true
    }
}
