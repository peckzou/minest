import SwiftUI

struct ContentView: View {
    @StateObject private var liveActivityManager = LiveActivityManager.shared
    private let bridge = MinestBridge()
    
    // Choose between remote web app or local bundled HTML
    private var targetURL: URL {
        // 1. Try local bundled HTML inside app bundle
        if let bundlePath = Bundle.main.url(forResource: "iphone12.8", withExtension: "html") {
            return bundlePath
        }
        // 2. Fallback to production web URL
        return URL(string: "https://minest-app.vercel.app") ?? URL(string: "http://localhost:3005")!
    }
    
    var body: some View {
        ZStack {
            Color(red: 11/255, green: 17/255, blue: 23/255)
                .ignoresSafeArea()
            
            MinestWebView(url: targetURL, bridge: bridge)
                .ignoresSafeArea()
        }
        .preferredColorScheme(.dark)
    }
}
