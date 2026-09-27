import SwiftUI
import TipKit

@main
struct MinestApp: App {
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
