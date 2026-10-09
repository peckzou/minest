import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, DesktopPetViewDelegate, MenuBarManagerDelegate, RewardEventListenerDelegate {
    private var panel: DesktopPetPanel!
    private var petView: DesktopPetView!
    private var menuBarManager: MenuBarManager!
    private var rewardListener: RewardEventListener!
    private let link = LinkServer()

    private var isPetVisible: Bool = true
    private var isKeepVisible: Bool = true
    private var isDragging: Bool = false
    private var hitRects: [CGRect] = []
    private var mouseTimer: Timer?

    // the desktop web app (Minest Web 30 · same data as the phone)
    static let minestURL = "https://minest-app.vercel.app/web"

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Run as accessory app (no Dock icon, stays in menu bar & desktop)
        NSApplication.shared.setActivationPolicy(.accessory)

        // 1. Transparent, non-activating panel; the empty parts let clicks through
        panel = DesktopPetPanel()
        let contentRect = NSRect(x: 0, y: 0, width: DesktopPetPanel.defaultSize, height: DesktopPetPanel.defaultHeight)
        petView = DesktopPetView(frame: contentRect)
        petView.delegate = self
        panel.contentView = petView

        // 2. The web Mini Pet (generated from the iPhone build)
        loadWebRuntime()

        // 3. Restore Preferences & Position
        restorePreferences()
        panel.restoreSavedPosition()
        if isPetVisible { panel.orderFrontRegardless() } else { panel.orderOut(nil) }

        // 4. Menu bar
        menuBarManager = MenuBarManager()
        menuBarManager.delegate = self
        menuBarManager.setupStatusItem()
        menuBarManager.updateState(isPetVisible: isPetVisible, isKeepVisible: isKeepVisible)

        // 5. Rewards from other local tools (file / distributed notification)
        rewardListener = RewardEventListener()
        rewardListener.delegate = self

        // 6. Link to the Minest page in the browser
        link.onMessage = { [weak self] json in
            guard let self = self else { return }
            // {t:'pet', visible} from the page's settings switch: show / hide this window
            if let data = json.data(using: .utf8), let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               obj["t"] as? String == "pet", let visible = obj["visible"] as? Bool {
                self.setPetVisibility(visible)
                return
            }
            self.petView.deliverLink(json: json)
        }
        link.onStatus = { [weak self] connected, _ in
            guard let self = self else { return }
            self.petView.linkStatus(connected: connected)
            self.menuBarManager.updateLink(connected: connected)
        }
        link.start()

        // 7. Clicks reach the pet only where it (or its menu / tip) is
        mouseTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            self?.updateMousePassThrough()
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleScreenParametersChanged),
            name: NSApplication.didChangeScreenParametersNotification,
            object: nil
        )

        print("🐙 [MinestDesktopPet] Launched successfully on macOS desktop.")
    }

    // Web 19.2 Appearance can show/hide the separate macOS Desktop Pet via
    // minest-desktop-pet://show and minest-desktop-pet://hide.
    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls where url.scheme == "minest-desktop-pet" {
            let action = (url.host ?? url.pathComponents.last ?? "").lowercased()
            switch action {
            case "show": setPetVisibility(true)
            case "hide": setPetVisibility(false)
            case "toggle": setPetVisibility(!isPetVisible)
            default: break
            }
        }
    }

    private func loadWebRuntime() {
        let bundle = Bundle.main
        var htmlURL = bundle.url(forResource: "index", withExtension: "html", subdirectory: "Web")

        if htmlURL == nil {
            // Fallback for standalone binary / bundle structure
            let appDir = bundle.bundleURL.deletingLastPathComponent()
            let candidate1 = bundle.bundleURL.appendingPathComponent("Contents/Resources/Web/index.html")
            let candidate2 = appDir.appendingPathComponent("Resources/Web/index.html")
            let candidate3 = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("macos/MinestDesktopPet/Resources/Web/index.html")
            htmlURL = [candidate1, candidate2, candidate3].first { FileManager.default.fileExists(atPath: $0.path) }
        }

        if let url = htmlURL {
            print("📁 [MinestDesktopPet] Loading web runtime from: \(url.path)")
            petView.loadWebRuntime(resourceURL: url)
        } else {
            print("⚠️ [MinestDesktopPet] Warning: Web runtime index.html not found.")
        }
    }

    private func restorePreferences() {
        if UserDefaults.standard.object(forKey: "minest.desktopPet.visible") != nil {
            self.isPetVisible = UserDefaults.standard.bool(forKey: "minest.desktopPet.visible")
        } else {
            self.isPetVisible = true
            UserDefaults.standard.set(true, forKey: "minest.desktopPet.visible")
        }
        if UserDefaults.standard.object(forKey: "minest.desktopPet.keepVisible") != nil {
            self.isKeepVisible = UserDefaults.standard.bool(forKey: "minest.desktopPet.keepVisible")
        } else {
            self.isKeepVisible = true
            UserDefaults.standard.set(true, forKey: "minest.desktopPet.keepVisible")
        }
        panel.level = self.isKeepVisible ? .floating : .normal
    }

    @objc private func handleScreenParametersChanged() {
        panel.clampToCurrentScreens()
    }

    // MARK: - Click-through outside the pet
    private func updateMousePassThrough() {
        guard panel.isVisible else { return }
        if isDragging { if panel.ignoresMouseEvents { panel.ignoresMouseEvents = false }; return }
        let p = NSEvent.mouseLocation
        let f = panel.frame
        // page coordinates: origin top-left of the window
        let x = p.x - f.minX, y = f.maxY - p.y
        let inside = hitRects.contains { $0.insetBy(dx: -4, dy: -4).contains(CGPoint(x: x, y: y)) }
        if panel.ignoresMouseEvents == inside { panel.ignoresMouseEvents = !inside }
    }

    // MARK: - DesktopPetViewDelegate
    func desktopPetDidRequestDragStart(screenX: CGFloat, screenY: CGFloat) {
        isDragging = true
        panel.beginWindowDrag(screenLocation: NSPoint(x: screenX, y: screenY))
    }

    func desktopPetDidRequestDragEnd(screenX: CGFloat, screenY: CGFloat) {
        isDragging = false
        panel.endWindowDrag()
    }

    func desktopPetDidRightClick(screenLocation: NSPoint) {
        menuBarManager.showContextMenu(at: screenLocation)
    }

    func desktopPetDidUpdateHitRects(_ rects: [CGRect]) {
        hitRects = rects
    }

    func desktopPetDidBecomeReady() {
        petView.linkStatus(connected: link.isConnected)
    }

    /// a bubble command / tip action / hold-to-talk from the pet → the Minest page
    func desktopPetDidSendLink(_ message: [String: Any]) {
        let name = message["name"] as? String ?? ""
        if link.isConnected, link.send(message) {
            if name != "ptt" { activateBrowser() }   // show the tool it opened (hold-to-talk stays in the background)
            return
        }
        // no Minest page open: open one that runs the command once it has loaded
        guard name != "ptt" else { return }
        var cmd = name
        if name == "act", let arg = message["arg"] as? [String: Any], let act = arg["act"] as? String {
            cmd = ["study": "study", "analyze": "analyze", "build": "build", "octo": "octo", "talk": "talk", "pron": "speak"][act] ?? ""
        }
        let allowed: Set<String> = ["study", "build", "analyze", "speak", "octo", "talk", "inbox"]
        var comps = URLComponents(string: AppDelegate.minestURL)!
        comps.queryItems = [URLQueryItem(name: "desktopPet", value: "1")] + (allowed.contains(cmd) ? [URLQueryItem(name: "pet", value: cmd)] : [])
        if let url = comps.url { NSWorkspace.shared.open(url) }
    }

    /// bring the browser with the Minest page forward
    private func activateBrowser() {
        let ua = link.userAgent ?? ""
        var ids: [String] = []
        if ua.contains("Edg/") { ids.append("com.microsoft.edgemac") }
        if ua.contains("Firefox/") { ids.append("org.mozilla.firefox") }
        if ua.contains("Chrome/") && !ua.contains("Edg/") { ids += ["com.google.Chrome", "company.thebrowser.Browser", "com.brave.Browser"] }
        if ua.contains("Safari/") && !ua.contains("Chrome/") { ids.append("com.apple.Safari") }
        for id in ids {
            if let app = NSRunningApplication.runningApplications(withBundleIdentifier: id).first {
                app.activate()
                return
            }
        }
    }

    // MARK: - MenuBarManagerDelegate
    func menuBarDidRequestNextAction() {
        petView.nextAction()
    }

    func menuBarDidTogglePetVisibility() {
        setPetVisibility(!isPetVisible)
    }

    func menuBarDidToggleKeepVisible() {
        isKeepVisible.toggle()
        UserDefaults.standard.set(isKeepVisible, forKey: "minest.desktopPet.keepVisible")
        panel.level = isKeepVisible ? .floating : .normal
        menuBarManager.updateState(isPetVisible: isPetVisible, isKeepVisible: isKeepVisible)
    }

    func menuBarDidRequestTalk() {
        // the same as the Talk bubble: the voice runs in the Minest page
        desktopPetDidSendLink(["t": "cmd", "name": "talk"])
    }

    func menuBarDidRequestPet() {
        petView.triggerReward(kind: "task")
    }

    func menuBarDidRequestOpenMinest() {
        if link.isConnected { activateBrowser(); return }
        if let url = URL(string: AppDelegate.minestURL + "?desktopPet=1") { NSWorkspace.shared.open(url) }
    }

    func menuBarDidRequestOpenPetMode() {
        // Octo's Pet Raising, in the Minest page
        desktopPetDidSendLink(["t": "cmd", "name": "octo"])
    }

    func menuBarDidRequestTriggerReward(kind: String) {
        petView.triggerReward(kind: kind)
    }

    func menuBarDidRequestQuit() {
        panel.saveCurrentPosition()
        NSApplication.shared.terminate(nil)
    }

    // MARK: - RewardEventListenerDelegate
    func rewardEventListenerDidReceiveReward(kind: String) {
        petView.triggerReward(kind: kind)
    }

    private func setPetVisibility(_ visible: Bool) {
        isPetVisible = visible
        UserDefaults.standard.set(visible, forKey: "minest.desktopPet.visible")
        if visible {
            panel.orderFrontRegardless()
            petView.resumeRendering()
        } else {
            panel.orderOut(nil)
            petView.pauseRendering()
        }
        menuBarManager?.updateState(isPetVisible: isPetVisible, isKeepVisible: isKeepVisible)
    }
}
