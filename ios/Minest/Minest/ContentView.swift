import SwiftUI
import ActivityKit
import WebKit
import CoreSpotlight
import TipKit

@available(iOS 17.0, *)
struct MinestFeaturesTip: Tip {
    var title: Text {
        Text("灵动岛与全场景控制已启用")
    }
    var message: Text? {
        Text("支持在灵动岛/锁屏直接打勾；支持将 Minest 添加至 iOS 18 控制中心与 iPhone 15 Pro 操作按钮快捷启动。")
    }
    var image: Image? {
        Image(systemName: "sparkles")
    }
}

struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var liveActivityManager = LiveActivityManager.shared
    private let bridge = MinestBridge()
    private let featuresTip = MinestFeaturesTip()
    @State private var isWebViewReady = false
    @State private var pollTimer: Timer? = nil
    @State private var isSplashDismissed = false
    @State private var minSplashElapsed = false
    @State private var showTip = true
    
    // Choose between local bundled HTML or remote web app
    private var targetURL: URL {
        if let bundlePath = Bundle.main.url(forResource: "iphone13.2", withExtension: "html") ?? Bundle.main.url(forResource: "iphone", withExtension: "html") ?? Bundle.main.url(forResource: "iphone13.2.html", withExtension: nil) {
            print("📱 [ContentView] Found local bundle URL: \(bundlePath)")
            return bundlePath
        }
        if let indexPath = Bundle.main.url(forResource: "index", withExtension: "html") {
            return indexPath
        }
        print("⚠️ [ContentView] No local bundle found, falling back to remote URL")
        return URL(string: "https://minest-app.vercel.app/iphone.html")!
    }
    
    var body: some View {
        ZStack {
            // Background color matching Minest dark theme
            Color(red: 11/255, green: 17/255, blue: 23/255)
                .ignoresSafeArea()
            
            // Main Web View with finish loading callback
            MinestWebView(url: targetURL, bridge: bridge) {
                withAnimation(.easeInOut(duration: 0.35)) {
                    isWebViewReady = true
                    checkDismissSplash()
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    checkPendingCards()
                }
            }
            .opacity(isSplashDismissed ? 1.0 : 0.0)
            .scaleEffect(isSplashDismissed ? 1.0 : 0.98)
            .ignoresSafeArea()
            
            // App Icon Splash Screen (Icon levitation, liquid specular glint, and checkmark stamps)
            if !isSplashDismissed {
                MinestAppIconSplashView()
                    .transition(
                        .asymmetric(
                            insertion: .identity,
                            removal: .scale(scale: 1.08).combined(with: .opacity)
                        )
                    )
                    .zIndex(10)
                    .onTapGesture {
                        dismissSplashImmediately()
                    }
            }
            
            // Native TipKit Discoverability Tip (Smoothly auto-dismisses after 3 seconds)
            if isSplashDismissed && showTip {
                VStack {
                    if #available(iOS 17.0, *) {
                        TipView(featuresTip)
                            .tipBackground(Color(red: 22/255, green: 27/255, blue: 34/255))
                            .padding(.horizontal, 16)
                            .padding(.top, 60)
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }
                    Spacer()
                }
                .zIndex(5)
                .task {
                    try? await Task.sleep(nanoseconds: 1_200_000_000)
                    withAnimation(.easeInOut(duration: 0.35)) {
                        showTip = false
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            startCommandPolling()
            setupPowerMonitoring()
            NativeMotionManager.shared.startUpdates()
            iPhoneWatchSyncManager.shared.bridge = bridge
            iPhoneWatchSyncManager.shared.syncToWatch()
            
            // Ensure minimum splash duration to enjoy full 3D icon animation & haptic ticks
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.35) {
                minSplashElapsed = true
                checkDismissSplash()
            }
            // Maximum splash timeout fallback: guarantee transition to main screen
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                dismissSplashImmediately()
            }
            
            // Listen for Siri Card Creation Events
            NotificationCenter.default.addObserver(
                forName: NSNotification.Name("MinestCreateCardNotification"),
                object: nil,
                queue: .main
            ) { notif in
                if let info = notif.userInfo,
                   let title = info["title"] as? String {
                    let id = info["id"] as? String ?? "card-\(UUID().uuidString.prefix(6))"
                    let category = info["category"] as? String ?? "学习看板"
                    let item = info["item"] as? String ?? title
                    print("🗣️ [ContentView] Received Siri Create Card Notification: \(title)")
                    self.bridge.createCard(id: id, title: title, category: category, item: item)
                }
            }
            
            // Restore from store if not already active
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                if !self.liveActivityManager.isActivityActive {
                    let titles = MinestWidgetDataStore.shared.getTitles()
                    let items = MinestWidgetDataStore.shared.getItems()
                    let completed = items.filter { $0.isDone }.count
                    self.liveActivityManager.updateActiveList(
                        boardTitle: titles.board,
                        listName: titles.card,
                        completedCards: completed,
                        totalCards: items.count,
                        items: items
                    )
                }
            }
        }
        .onChange(of: scenePhase) { oldPhase, newPhase in
            handleScenePhaseChange(from: oldPhase, to: newPhase)
        }
        .onOpenURL { url in
            handleOpenURL(url)
        }
        // Handle iOS Spotlight search results
        .onContinueUserActivity(CSSearchableItemActionType) { userActivity in
            if let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String {
                let cardId = identifier.replacingOccurrences(of: "minest-card-", with: "")
                print("🔍 [ContentView] User tapped Spotlight result for card: \(cardId)")
                bridge.openCard(cardId: cardId)
            }
        }
    }
    
    // MARK: - Power & Battery Monitoring
    private func setupPowerMonitoring() {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name.NSProcessInfoPowerStateDidChange,
            object: nil,
            queue: .main
        ) { _ in
            let isLowPower = ProcessInfo.processInfo.isLowPowerModeEnabled
            print("🔋 [ContentView] Low Power Mode changed: \(isLowPower)")
            bridge.sendLowPowerMode(isEnabled: isLowPower)
        }
    }
    
    // MARK: - Scene Lifecycle Management
    private func handleScenePhaseChange(from oldPhase: ScenePhase, to newPhase: ScenePhase) {
        switch newPhase {
        case .background:
            print("🌙 [ContentView] App entered background -> pause animations & save backup")
            NativeMotionManager.shared.stopUpdates()
            bridge.sendAppLifecycle(state: "background")
            
            // Backup localStorage to native Documents
            bridge.webView?.evaluateJavaScript("""
            (function() {
                var data = localStorage.getItem('focusboard_data') || localStorage.getItem('minest_boards') || '';
                if (data && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.minestBridge) {
                    window.webkit.messageHandlers.minestBridge.postMessage({ action: 'saveBackup', data: data });
                }
            })();
            """, completionHandler: nil)
            
        case .active:
            print("☀️ [ContentView] App became active -> restore state & resume animations")
            NativeMotionManager.shared.startUpdates()
            liveActivityManager.restoreActiveActivity()
            bridge.sendAppLifecycle(state: "active")
            bridge.sendLowPowerMode(isEnabled: ProcessInfo.processInfo.isLowPowerModeEnabled)
            checkPendingCards()
            iPhoneWatchSyncManager.shared.syncToWatch()
            
            // Extract boards from Web to sync full multi-lists to Apple Watch
            bridge.webView?.evaluateJavaScript("""
            (function() {
                try {
                    var b = localStorage.getItem('focusboard_boards_v4') || localStorage.getItem('focusboard_boards_data') || localStorage.getItem('focusboard_data');
                    if (b && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.minestBridge) {
                        window.webkit.messageHandlers.minestBridge.postMessage({ action: 'syncAllBoards', boardsJSON: b });
                    }
                } catch(e) {}
            })();
            """, completionHandler: nil)
            
        case .inactive:
            break
            
        @unknown default:
            break
        }
    }
    
    // MARK: - Deep Link URL Handler
    private func handleOpenURL(_ url: URL) {
        print("🔗 [Minest] Received URL: \(url)")
        let host = url.host ?? ""
        if host == "checklist" {
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            let completed = Int(components?.queryItems?.first(where: { $0.name == "completed" })?.value ?? "1") ?? 1
            let total = Int(components?.queryItems?.first(where: { $0.name == "total" })?.value ?? "5") ?? 5
            let title = components?.queryItems?.first(where: { $0.name == "title" })?.value ?? "Checklist"
            let itemText = components?.queryItems?.first(where: { $0.name == "item" })?.value ?? title
            let isDone = (components?.queryItems?.first(where: { $0.name == "isDone" })?.value ?? "0") == "1"
            let isAllDone = completed >= total && total > 0
            liveActivityManager.updateChecklist(cardTitle: title, completedCount: completed, totalCount: total, itemText: itemText, isAllDone: isAllDone)
            if isAllDone {
                NativeSoundAndHaptics.shared.playCelebration()
            } else {
                NativeSoundAndHaptics.shared.playChecklistTick(isDone: isDone)
            }
        } else if host == "card" {
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            if let cardId = components?.queryItems?.first(where: { $0.name == "id" })?.value {
                bridge.openCard(cardId: cardId)
            }
        } else if host == "create-card" || host == "new-card" {
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            let title = components?.queryItems?.first(where: { $0.name == "title" })?.value ?? "新建卡片"
            let category = components?.queryItems?.first(where: { $0.name == "category" })?.value ?? "学习看板"
            let item = components?.queryItems?.first(where: { $0.name == "item" })?.value ?? title
            let id = "card-\(UUID().uuidString.prefix(6))"
            bridge.createCard(id: id, title: title, category: category, item: item)
        }
    }
    
    // MARK: - Siri & Share Extension Cards Sync
    private func checkPendingCards() {
        checkPendingSiriCards()
        checkPendingShareCards()
    }
    
    private func checkPendingSiriCards() {
        let pending = MinestWidgetDataStore.shared.consumePendingCards()
        for card in pending {
            if let title = card["title"] as? String {
                let id = card["id"] as? String ?? "card-\(UUID().uuidString.prefix(6))"
                let category = card["category"] as? String ?? "学习看板"
                let item = card["item"] as? String ?? title
                print("📥 [ContentView] Syncing pending Siri card: \(title)")
                bridge.createCard(id: id, title: title, category: category, item: item)
            }
        }
    }
    
    private func checkPendingShareCards() {
        let pending = ShareDataStore.shared.loadPendingCards()
        guard !pending.isEmpty else { return }
        ShareDataStore.shared.clearPendingCards()
        
        for card in pending {
            print("📥 [ContentView] Syncing incoming share card: \(card.title)")
            bridge.createCard(
                id: card.id,
                title: card.title,
                category: card.category,
                item: card.notes.isEmpty ? (card.urlString ?? card.title) : "\(card.notes)\n\(card.urlString ?? "")"
            )
        }
        NativeSoundAndHaptics.shared.playCelebration()
    }
    
    // MARK: - Local Test Command Poller
    private func startCommandPolling() {
        guard let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
        let cmdFile = docs.appendingPathComponent("minest_command.txt")
        
        pollTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            if FileManager.default.fileExists(atPath: cmdFile.path) {
                if let content = try? String(contentsOf: cmdFile, encoding: .utf8) {
                    try? FileManager.default.removeItem(at: cmdFile)
                    let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
                    print("⚡ [Minest] Polled command: \(trimmed)")
                    self.executeCommand(trimmed)
                }
            }
        }
    }
    
    private func executeCommand(_ cmd: String) {
        if cmd.starts(with: "checklist:") {
            let parts = cmd.components(separatedBy: ":")
            if parts.count >= 2 {
                let ratio = parts[1].components(separatedBy: "/")
                let completed = Int(ratio.first ?? "1") ?? 1
                let total = Int(ratio.last ?? "5") ?? 5
                let title = parts.count >= 3 ? parts[2] : "Checklist Item"
                let isAllDone = completed >= total
                liveActivityManager.updateChecklist(cardTitle: title, completedCount: completed, totalCount: total, itemText: title, isAllDone: isAllDone)
                if isAllDone {
                    NativeSoundAndHaptics.shared.playCelebration()
                } else {
                    NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
                }
            }
        } else if cmd == "end" {
            liveActivityManager.endStudySession(dismissImmediately: true)
        } else if cmd == "sync_share" {
            DispatchQueue.main.async {
                self.checkPendingShareCards()
            }
        } else if cmd == "load_bundle" {
            DispatchQueue.main.async {
                if let bundleURL = Bundle.main.url(forResource: "iphone13.2", withExtension: "html") ?? Bundle.main.url(forResource: "iphone", withExtension: "html") ?? Bundle.main.url(forResource: "iphone13.2.html", withExtension: nil) {
                    print("⚡ [Minest] Loading local bundle URL directly: \(bundleURL)")
                    self.bridge.webView?.loadFileURL(bundleURL, allowingReadAccessTo: bundleURL.deletingLastPathComponent())
                }
            }
        } else if cmd.starts(with: "eval:") {
            let js = String(cmd.dropFirst(5))
            DispatchQueue.main.async {
                self.bridge.webView?.evaluateJavaScript(js) { res, err in
                    guard let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
                    let resFile = docs.appendingPathComponent("debug_eval_res.txt")
                    let outStr = "res: \(String(describing: res)), err: \(String(describing: err))"
                    try? outStr.write(to: resFile, atomically: true, encoding: .utf8)
                    print("⚡ [Minest eval]: \(outStr)")
                }
            }
        }
    }
    
    // MARK: - Splash Dismissal Logic
    private func checkDismissSplash() {
        if isWebViewReady && minSplashElapsed {
            withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                isSplashDismissed = true
            }
        }
    }
    
    private func dismissSplashImmediately() {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            isSplashDismissed = true
        }
    }
}
