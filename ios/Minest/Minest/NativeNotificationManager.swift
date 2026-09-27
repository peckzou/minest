import Foundation
import UserNotifications

/// Handles native iOS local notifications for study timers, breaks, and checklists
@MainActor
public final class NativeNotificationManager: NSObject, UNUserNotificationCenterDelegate {
    public static let shared = NativeNotificationManager()
    
    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    /// Requests notification permissions from the user
    public func requestAuthorization(completion: ((Bool) -> Void)? = nil) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("❌ [NotificationManager] Auth error: \(error.localizedDescription)")
                }
                print("🔔 [NotificationManager] Notification permission: \(granted ? "Granted" : "Denied")")
                completion?(granted)
            }
        }
    }
    
    /// Schedules a local notification after delaySeconds
    public func scheduleNotification(
        id: String = UUID().uuidString,
        title: String,
        body: String,
        delaySeconds: TimeInterval,
        userInfo: [String: Any] = [:]
    ) {
        requestAuthorization { [weak self] granted in
            guard granted else { return }
            
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.sound = .default
            content.userInfo = userInfo
            
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(delaySeconds, 1.0), repeats: false)
            let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("❌ [NotificationManager] Failed to schedule: \(error.localizedDescription)")
                } else {
                    print("🔔 [NotificationManager] Scheduled '\(title)' in \(Int(delaySeconds))s (id: \(id))")
                }
            }
        }
    }
    
    /// Cancels a specific scheduled notification
    public func cancelNotification(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [id])
        print("🔕 [NotificationManager] Cancelled notification: \(id)")
    }
    
    /// Cancels all pending notifications
    public func cancelAll() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        print("🔕 [NotificationManager] Cancelled all notifications")
    }
    
    // Display banner even when app is in foreground
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
}
