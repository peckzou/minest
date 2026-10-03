import SwiftUI

@main
struct MinestWatchApp: App {
    init() {
        // Activate WCSession sync immediately upon watch app launch
        _ = WatchSyncManager.shared
        #if DEBUG
        // Simulator preview of the ceremonies: launch with MINEST_DEMO_CEREMONY=1
        if ProcessInfo.processInfo.environment["MINEST_DEMO_CEREMONY"] == "1" {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                WatchSyncManager.shared.enqueueCeremony(.rings(strikeDays: 1))
                WatchSyncManager.shared.enqueueCeremony(.claim(badgeId: "cartoon-pixel-retro"))
            }
        }
        #endif
    }
    
    var body: some Scene {
        WindowGroup {
            // Watch 4.0: Fitness rings page on top, checklist below
            WatchFitnessRootView()
        }
    }
}
