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

final class MinestAppDelegate: NSObject, UIApplicationDelegate {
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
