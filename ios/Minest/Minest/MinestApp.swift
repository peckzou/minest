import SwiftUI
import UIKit
import Combine
import TipKit

// MARK: - 31.6 Home Screen quick actions (long-press the app icon)

/// Shortcut types registered in Minest-Info.plist (UIApplicationShortcutItems).
enum MinestQuickAction: String {
    case startTimer = "com.zouminmin.minest.startTimer"
    case newCard = "com.zouminmin.minest.newCard"
}

/// Hands a quick action to ContentView; a cold-launch action waits here until the web app is ready.
final class MinestQuickActionRouter: ObservableObject {
    static let shared = MinestQuickActionRouter()
    @Published var pending: MinestQuickAction? = nil

    func handle(_ item: UIApplicationShortcutItem) -> Bool {
        guard let action = MinestQuickAction(rawValue: item.type) else { return false }
        DispatchQueue.main.async { self.pending = action }
        return true
    }
}

/// The page can ask for an orientation (bridge action "setOrientation": landscape / portrait / auto).
enum MinestOrientation {
    static var mask: UIInterfaceOrientationMask = .allButUpsideDown
    static func set(_ want: String) {
        let next: UIInterfaceOrientationMask = want == "landscape" ? .landscape : want == "portrait" ? .portrait : .allButUpsideDown
        mask = next
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else { return }
        scene.windows.forEach { $0.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations() }
        let geometry: UIInterfaceOrientationMask = want == "landscape" ? .landscape : .portrait
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: geometry)) { error in
            print("⚠️ [MinestOrientation] \(error.localizedDescription)")
        }
        if want == "auto" { DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { mask = .allButUpsideDown; scene.windows.forEach { $0.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations() } } }
    }
}

final class MinestAppDelegate: NSObject, UIApplicationDelegate {
    // 53.6: the island view asks for landscape (MinestOrientation); everything else keeps the usual turns
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        MinestOrientation.mask
    }
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Cold launch from a quick action
        if let item = options.shortcutItem { _ = MinestQuickActionRouter.shared.handle(item) }
        let config = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        config.delegateClass = MinestSceneDelegate.self
        return config
    }
}

final class MinestSceneDelegate: NSObject, UIWindowSceneDelegate {
    // Quick action while Minest is already running
    func windowScene(_ windowScene: UIWindowScene,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        completionHandler(MinestQuickActionRouter.shared.handle(shortcutItem))
    }
}

@main
struct MinestApp: App {
    @UIApplicationDelegateAdaptor(MinestAppDelegate.self) private var appDelegate

    init() {
        // Pre-warm WebKit rendering engine and Taptic generators at launch
        MinestWebView.prewarm()
        NativeSoundAndHaptics.shared.prepareAll()
        
        // Configure TipKit for native iOS onboarding & discoverability
        if #available(iOS 17.0, *) {
            try? Tips.configure([
                .displayFrequency(.immediate),
                .datastoreLocation(.applicationDefault)
            ])
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
