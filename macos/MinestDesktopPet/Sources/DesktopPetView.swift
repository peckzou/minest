import AppKit
import WebKit

protocol DesktopPetViewDelegate: AnyObject {
    func desktopPetDidRequestDragStart(screenX: CGFloat, screenY: CGFloat)
    func desktopPetDidRequestDragEnd(screenX: CGFloat, screenY: CGFloat)
    func desktopPetDidRightClick(screenLocation: NSPoint)
    /// the clickable parts of the pet page (pet, menu bubbles, tip, inbox), in page coordinates
    func desktopPetDidUpdateHitRects(_ rects: [CGRect])
    /// a message for the Minest page (bubble commands, tip actions, hold-to-talk)
    func desktopPetDidSendLink(_ message: [String: Any])
    func desktopPetDidBecomeReady()
}

/// The pet itself is the web Mini Pet (Resources/Web, generated from the iPhone build by sync-web.py).
final class DesktopPetView: NSView, WKScriptMessageHandler {
    weak var delegate: DesktopPetViewDelegate?
    private(set) var webView: WKWebView!

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        setupWebView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupWebView()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        // persistent, so the outfit, inbox and held badge survive a restart (like the web page)
        config.websiteDataStore = .default()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.userContentController.add(self, name: "desktopPet")

        let wv = WKWebView(frame: self.bounds, configuration: config)
        wv.autoresizingMask = [.width, .height]
        wv.setValue(false, forKey: "drawsBackground")
        wv.underPageBackgroundColor = .clear
        if #available(macOS 13.3, *) { wv.isInspectable = true }   // Safari → Develop menu, for debugging

        self.addSubview(wv)
        self.webView = wv
    }

    func loadWebRuntime(resourceURL: URL) {
        let baseURL = resourceURL.deletingLastPathComponent()
        self.webView.loadFileURL(resourceURL, allowingReadAccessTo: baseURL)
    }

    // MARK: - Script Message Handler
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let dict = message.body as? [String: Any],
              let type = dict["type"] as? String else { return }

        switch type {
        case "dragStart":
            delegate?.desktopPetDidRequestDragStart(screenX: NSEvent.mouseLocation.x, screenY: NSEvent.mouseLocation.y)
        case "dragEnd":
            delegate?.desktopPetDidRequestDragEnd(screenX: NSEvent.mouseLocation.x, screenY: NSEvent.mouseLocation.y)
        case "rightClick":
            delegate?.desktopPetDidRightClick(screenLocation: NSEvent.mouseLocation)
        case "hit":
            let raw = dict["rects"] as? [[Any]] ?? []
            let rects: [CGRect] = raw.compactMap { r in
                let n = r.compactMap { ($0 as? NSNumber)?.doubleValue }
                return n.count == 4 ? CGRect(x: n[0], y: n[1], width: n[2], height: n[3]) : nil
            }
            delegate?.desktopPetDidUpdateHitRects(rects)
        case "link":
            if let msg = dict["msg"] as? [String: Any] { delegate?.desktopPetDidSendLink(msg) }
        case "ready":
            print("🐙 [DesktopPetView] Mini Pet ready (\(dict["source"] as? String ?? "?")).")
            delegate?.desktopPetDidBecomeReady()
        default:
            break
        }
    }

    // MARK: - JS helpers
    /// a message from the Minest page (validated JSON) → the pet
    func deliverLink(json: String) {
        webView.evaluateJavaScript("window.__desktopLink && window.__desktopLink.receive(\(json));", completionHandler: nil)
    }

    func linkStatus(connected: Bool) {
        webView.evaluateJavaScript("window.__desktopLink && window.__desktopLink.receive({t:'status',connected:\(connected)});", completionHandler: nil)
    }

    func playAction(name: String) { call("playAction('\(name.filter { $0.isLetter || $0 == "_" })')") }
    func nextAction() { call("nextAction()") }
    func triggerReward(kind: String) { call("triggerReward('\(kind.filter { $0.isLetter || $0 == "-" })')") }
    func setVoiceState(state: String) { call("setVoiceState('\(state.filter { $0.isLetter })')") }
    func pauseRendering() { call("pause()") }
    func resumeRendering() { call("resume()") }

    private func call(_ js: String) {
        webView.evaluateJavaScript("window.desktopPet && window.desktopPet.\(js);", completionHandler: nil)
    }
}
