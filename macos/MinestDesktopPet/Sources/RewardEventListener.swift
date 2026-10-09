import AppKit

protocol RewardEventListenerDelegate: AnyObject {
    func rewardEventListenerDidReceiveReward(kind: String)
}

final class RewardEventListener {
    weak var delegate: RewardEventListenerDelegate?

    private var fileTimer: Timer?
    private var lastEventTimestamp: TimeInterval = 0
    private let eventFileURL: URL

    init() {
        // Shared directory for Minest Desktop IPC
        let fm = FileManager.default
        let appSupport = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first ?? fm.temporaryDirectory
        let minestDir = appSupport.appendingPathComponent("Minest", isDirectory: true)
        try? fm.createDirectory(at: minestDir, withIntermediateDirectories: true)
        self.eventFileURL = minestDir.appendingPathComponent("reward_event.json")

        setupDistributedNotificationListener()
        startFileWatcher()
    }

    private func setupDistributedNotificationListener() {
        DistributedNotificationCenter.default().addObserver(
            forName: NSNotification.Name("com.zouminmin.minest.rewardEvent"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            let kind = (notification.userInfo?["kind"] as? String) ?? "task"
            self?.notifyReward(kind: kind)
        }
    }

    private func startFileWatcher() {
        fileTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.checkEventFile()
        }
    }

    private func checkEventFile() {
        guard FileManager.default.fileExists(atPath: eventFileURL.path) else { return }
        do {
            let data = try Data(contentsOf: eventFileURL)
            try? FileManager.default.removeItem(at: eventFileURL)

            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let kind = json["kind"] as? String {
                notifyReward(kind: kind)
            }
        } catch {
            // ignore read collisions
        }
    }

    func notifyReward(kind: String) {
        let now = Date().timeIntervalSince1970
        guard now - lastEventTimestamp > 1.2 else { return } // Cooldown
        lastEventTimestamp = now

        DispatchQueue.main.async { [weak self] in
            self?.delegate?.rewardEventListenerDidReceiveReward(kind: kind)
        }
    }

    deinit {
        fileTimer?.invalidate()
        DistributedNotificationCenter.default().removeObserver(self)
    }
}
