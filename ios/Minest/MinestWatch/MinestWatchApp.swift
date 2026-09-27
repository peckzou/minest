import SwiftUI

@main
struct MinestWatchApp: App {
    init() {
        // Activate WCSession sync immediately upon watch app launch
        _ = WatchSyncManager.shared
    }
    
    var body: some Scene {
        WindowGroup {
            WatchChecklistView()
        }
    }
}
