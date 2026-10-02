import Foundation
import WebKit
import UIKit

/// Enhanced Swift Bridge connecting WKWebView JS to native iOS capabilities
public final class MinestBridge: NSObject, WKScriptMessageHandler {
    public static let primaryHandlerName = "minestBridge"
    public static let legacyHandlerName = "focusboardBridge"
    public weak var webView: WKWebView?
    
    public override init() {
        super.init()
        NativeMotionManager.shared.bridge = self
    }
    
    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == Self.primaryHandlerName || message.name == Self.legacyHandlerName else { return }
        
        let dict: [String: Any]
        if let messageDict = message.body as? [String: Any] {
            dict = messageDict
        } else if let jsonString = message.body as? String,
                  let data = jsonString.data(using: .utf8),
                  let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            dict = parsed
        } else {
            print("⚠️ [MinestBridge] Unrecognized message body: \(message.body)")
            return
        }
        
        guard let action = dict["action"] as? String else {
            print("⚠️ [MinestBridge] Missing 'action' field")
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            self?.handleAction(action, data: dict)
        }
    }
    
    private func handleAction(_ action: String, data: [String: Any]) {
        let boardTitle = data["boardTitle"] as? String ?? "Minest"
        let totalCards = data["totalCards"] as? Int ?? (data["totalCount"] as? Int ?? 20)
        let completedCards = data["completedCards"] as? Int ?? (data["completedCount"] as? Int ?? 0)
        let remainingMinutes = data["remainingMinutes"] as? Int ?? 15
        let currentCardTitle = data["currentCardTitle"] as? String ?? (data["cardTitle"] as? String ?? "")
        
        switch action {
        // =====================================================================
        // Dynamic Island / Live Activity + Synchronized Sound/Haptics
        // =====================================================================
        case "activeListUpdated", "columnChanged", "cardToggled", "checklistUpdated", "checklistToggled":
            let listName = (data["listName"] as? String) ?? (data["cardTitle"] as? String) ?? "清单"
            let completed = data["completedCards"] as? Int ?? (data["completedCount"] as? Int ?? 0)
            let total = data["totalCards"] as? Int ?? (data["totalCount"] as? Int ?? 0)
            let itemText = data["itemText"] as? String ?? listName
            let isAllDone = data["isAllDone"] as? Bool ?? (completed >= total && total > 0)
            let isDone = data["isDone"] as? Bool ?? true
            
            let itemsData = (data["cards"] as? [[String: Any]]) ?? (data["checklistItems"] as? [[String: Any]]) ?? []
            let itemsList: [StudyActivityAttributes.ChecklistItemState] = itemsData.compactMap { d in
                guard let text = (d["text"] as? String) ?? (d["title"] as? String), !text.isEmpty else { return nil }
                let id = (d["id"] as? String) ?? text
                let done = (d["done"] as? Bool) ?? (d["complete"] as? Bool) ?? false
                return StudyActivityAttributes.ChecklistItemState(id: id, text: text, isDone: done)
            }
            
            LiveActivityManager.shared.updateActiveList(
                boardTitle: boardTitle,
                listName: listName,
                completedCards: completed,
                totalCards: total,
                items: itemsList
            )
            
            // Audio-haptic synchrony when explicitly toggled
            if action == "cardToggled" || action == "checklistToggled" {
                if isAllDone {
                    NativeSoundAndHaptics.shared.playCelebration()
                } else {
                    NativeSoundAndHaptics.shared.playChecklistTick(isDone: isDone)
                }
            }
            iPhoneWatchSyncManager.shared.syncToWatch()
            
        case "studyStarted":
            LiveActivityManager.shared.startStudySession(
                boardTitle: boardTitle,
                totalCards: totalCards,
                completedCards: completedCards,
                remainingMinutes: remainingMinutes,
                currentCardTitle: currentCardTitle
            )
            NativeSoundAndHaptics.shared.trigger(style: "medium", sound: .pop)
            
        case "progressUpdated":
            LiveActivityManager.shared.updateProgress(
                completedCards: completedCards,
                totalCards: totalCards,
                remainingMinutes: remainingMinutes,
                currentCardTitle: currentCardTitle
            )
            NativeSoundAndHaptics.shared.trigger(style: "selection", sound: .tick)
            
        case "studyFinished":
            LiveActivityManager.shared.endStudySession(dismissImmediately: false)
            NativeSoundAndHaptics.shared.playCelebration()
            
        case "studyPaused":
            LiveActivityManager.shared.updateProgress(
                completedCards: completedCards,
                isPaused: true
            )
            NativeSoundAndHaptics.shared.trigger(style: "light")
            
        case "endActivity", "dismissIsland":
            LiveActivityManager.shared.endAllActivities()
            NativeSoundAndHaptics.shared.trigger(style: "light")
            
        // =====================================================================
        // Audio & Haptic Feedback Engine
        // =====================================================================
        case "triggerHaptic", "haptic":
            let style = data["style"] as? String ?? "light"
            let sound = (data["sound"] as? Bool) ?? false
            let soundType: NativeSoundAndHaptics.SoundType = sound ? (style == "success" ? .celebrate : .tick) : .none
            NativeSoundAndHaptics.shared.trigger(style: style, sound: soundType)
            
        case "setAudioFeedback":
            if let enabled = data["enabled"] as? Bool {
                NativeSoundAndHaptics.shared.isAudioEnabled = enabled
            }
            if let hapticEnabled = data["hapticEnabled"] as? Bool {
                NativeSoundAndHaptics.shared.isHapticEnabled = hapticEnabled
            }
            
        // =====================================================================
        // Card Gameplay Audio-Haptics & Shake to Draw
        // =====================================================================
        case "cardAction":
            let subAction = data["subAction"] as? String ?? data["type"] as? String ?? ""
            switch subAction {
            case "flip":
                NativeSoundAndHaptics.shared.playCardFlip()
            case "swipe":
                NativeSoundAndHaptics.shared.playCardSwipe()
            case "rate":
                let level = data["level"] as? Int ?? (data["score"] as? Int ?? 3)
                NativeSoundAndHaptics.shared.playMasteryRate(level: level)
            case "shuffle", "shake":
                NativeSoundAndHaptics.shared.playCardShuffle()
            case "shatter", "smash":
                NativeSoundAndHaptics.shared.playCardShatter()
            default:
                NativeSoundAndHaptics.shared.trigger(style: "light")
            }
            
        case "shakeToDraw":
            NativeMotionManager.shared.handleShakeDetected()
            
        case "startMotionTilt":
            NativeMotionManager.shared.startUpdates()
            
        case "stopMotionTilt":
            NativeMotionManager.shared.stopUpdates()
            
        // =====================================================================
        // CoreSpotlight Search Integration
        // =====================================================================
        case "indexCards":
            if let cards = data["cards"] as? [[String: Any]] {
                NativeSpotlightManager.shared.indexCards(cards)
            }
            
        case "deleteIndexedCard":
            if let cardId = data["cardId"] as? String {
                NativeSpotlightManager.shared.deleteCard(id: cardId)
            }
            
        case "clearSpotlightIndex":
            NativeSpotlightManager.shared.clearAll()
            
        // =====================================================================
        // Native Notifications
        // =====================================================================
        case "scheduleNotification":
            let title = data["title"] as? String ?? "Minest"
            let body = data["body"] as? String ?? "Time to review cards!"
            let delay = (data["delaySeconds"] as? Double) ?? (data["delaySeconds"] as? Int).map(Double.init) ?? 60.0
            let id = data["id"] as? String ?? UUID().uuidString
            NativeNotificationManager.shared.scheduleNotification(id: id, title: title, body: body, delaySeconds: delay)
            
        case "cancelNotification":
            if let id = data["id"] as? String {
                NativeNotificationManager.shared.cancelNotification(id: id)
            } else {
                NativeNotificationManager.shared.cancelAll()
            }
            
        // =====================================================================
        // Share Sheet & Export / Import
        // =====================================================================
        case "share":
            let text = data["text"] as? String
            let urlString = data["url"] as? String
            let url = urlString.flatMap(URL.init(string:))
            let jsonData = data["jsonData"] as? String
            let filename = data["filename"] as? String ?? "MinestBoard.json"
            NativeDocumentManager.shared.share(text: text, url: url, jsonData: jsonData, filename: filename)
            NativeSoundAndHaptics.shared.trigger(style: "light", sound: .pop)
            
        case "exportBoard":
            let jsonData = data["boardJSON"] as? String ?? data["content"] as? String ?? ""
            let filename = data["filename"] as? String ?? "Minest_Export.json"
            NativeDocumentManager.shared.share(jsonData: jsonData, filename: filename)
            NativeSoundAndHaptics.shared.trigger(style: "medium", sound: .pop)
            
        case "importBoard":
            NativeDocumentManager.shared.presentDocumentPicker { [weak self] content in
                guard let content = content else { return }
                self?.sendEventToWeb(event: "onBoardImported", payload: ["content": content])
                NativeSoundAndHaptics.shared.trigger(style: "success", sound: .complete)
            }
            
        // =====================================================================
        // Native Document Persistence & Backup
        // =====================================================================
        case "saveBackup":
            if let content = data["data"] as? String ?? data["content"] as? String {
                let filename = data["filename"] as? String ?? "minest_boards_backup.json"
                _ = NativeDocumentManager.shared.saveToDocuments(data: content, filename: filename)
            }
            
        case "loadBackup":
            let filename = data["filename"] as? String ?? "minest_boards_backup.json"
            if let content = NativeDocumentManager.shared.readFromDocuments(filename: filename) {
                sendEventToWeb(event: "onBackupLoaded", payload: ["content": content])
            }
            
        // =====================================================================
        // Diagnostics & Memory
        // =====================================================================
        case "getMemoryUsage":
            let mb = NativeDocumentManager.getProcessMemoryMB()
            sendEventToWeb(event: "onMemoryUsage", payload: ["memoryMB": mb])
            
        case "syncAllBoards", "updateBoards":
            if let boardsJSON = data["boardsJSON"] as? String ?? data["content"] as? String {
                iPhoneWatchSyncManager.shared.updateBoardsFromWeb(boardsJSON: boardsJSON)
            }
            
        case "updateActivityRings":
            let focusMinutes = data["focusMinutes"] as? Int ?? 0
            let targetMinutes = data["targetMinutes"] as? Int ?? 30
            let checkCount = data["checkCount"] as? Int ?? 0
            let targetChecks = data["targetChecks"] as? Int ?? 10
            let goalPercent = data["goalPercent"] as? Int ?? 0
            let targetGoalPercent = data["targetGoalPercent"] as? Int ?? 100
            iPhoneWatchSyncManager.shared.pushActivityRingsToWatch(
                focusMinutes: focusMinutes,
                checkCount: checkCount,
                goalPercent: goalPercent,
                targetMinutes: targetMinutes,
                targetChecks: targetChecks,
                targetGoalPercent: targetGoalPercent
            )
            
        case "selectBoard":
            if let boardId = data["boardId"] as? String {
                iPhoneWatchSyncManager.shared.setSelectedBoard(boardId)
            }
            
        case "selectList":
            if let listId = data["listId"] as? String {
                iPhoneWatchSyncManager.shared.setSelectedList(listId)
            }
            
        default:
            print("ℹ️ [MinestBridge] Unhandled action: \(action)")
        }
    }
    
    // MARK: - Native to Web Events
    
    /// Notify Web of Low Power Mode state change
    public func sendLowPowerMode(isEnabled: Bool) {
        let js = """
        (function() {
            var root = document.documentElement;
            if (root) {
                root.classList.toggle('low-power-mode', \(isEnabled));
            }
            if (window.MinestNative && window.MinestNative.onLowPowerModeChanged) {
                window.MinestNative.onLowPowerModeChanged(\(isEnabled));
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Notify Web of App Lifecycle (e.g. pause/resume animations and timers)
    public func sendAppLifecycle(state: String) {
        let isBackground = (state == "background")
        let js = """
        (function() {
            if (window.MinestNative && window.MinestNative.onAppLifecycle) {
                window.MinestNative.onAppLifecycle('\(state)');
            }
            // Dispatch standard visibilitychange event if not already fired
            if (document.hidden !== \(isBackground)) {
                window.dispatchEvent(new Event('\(isBackground ? "pagehide" : "pageshow")'));
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Open a specific card from Spotlight search or Push Notification
    public func openCard(cardId: String) {
        let js = """
        (function() {
            if (window.MinestNative && window.MinestNative.openCard) {
                window.MinestNative.openCard('\(cardId)');
            } else {
                window.location.hash = '#card-\(cardId)';
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Send an event back to JS
    public func sendEventToWeb(event: String, payload: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }
        
        let js = """
        (function() {
            var data = \(jsonString);
            if (window.MinestNative && window.MinestNative.onNativeEvent) {
                window.MinestNative.onNativeEvent('\(event)', data);
            }
            if (window.__minestNative && window.__minestNative.onNativeEvent) {
                window.__minestNative.onNativeEvent('\(event)', data);
            }
            window.dispatchEvent(new CustomEvent('minestNativeEvent', { detail: { event: '\(event)', payload: data } }));
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Send real-time 3D tilt and Liquid Glass optical metrics to WebKit
    public func sendTilt(
        x: Double,
        y: Double,
        roll: Double,
        pitch: Double,
        specularX: Double = 0.0,
        specularY: Double = 0.0,
        refractionAngle: Double = 135.0,
        shadowOffsetX: Double = 0.0,
        shadowOffsetY: Double = 8.0,
        parallaxDepth: Double = 0.0
    ) {
        let js = """
        (function() {
            if (window.MinestNative && window.MinestNative.onDeviceTilt) {
                window.MinestNative.onDeviceTilt({
                    x: \(String(format: "%.3f", x)),
                    y: \(String(format: "%.3f", y)),
                    roll: \(String(format: "%.2f", roll)),
                    pitch: \(String(format: "%.2f", pitch)),
                    specularX: \(String(format: "%.2f", specularX)),
                    specularY: \(String(format: "%.2f", specularY)),
                    refractionAngle: \(String(format: "%.1f", refractionAngle)),
                    shadowOffsetX: \(String(format: "%.2f", shadowOffsetX)),
                    shadowOffsetY: \(String(format: "%.2f", shadowOffsetY)),
                    parallaxDepth: \(String(format: "%.2f", parallaxDepth))
                });
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Trigger random card draw with visual flare
    public func sendShakeToDraw() {
        let js = """
        (function() {
            if (window.MinestNative && window.MinestNative.onShakeToDraw) {
                window.MinestNative.onShakeToDraw();
            } else {
                window.dispatchEvent(new CustomEvent('minestShakeToDraw'));
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
    
    /// Dispatch card creation to the web view
    public func createCard(id: String, title: String, category: String, item: String) {
        let escapedTitle = title.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: " ")
        let escapedCat = category.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: " ")
        let escapedItem = item.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: " ")
        
        let js = """
        (function() {
            if (window.MinestNative && window.MinestNative.createCard) {
                window.MinestNative.createCard({
                    id: '\(id)',
                    title: "\(escapedTitle)",
                    category: "\(escapedCat)",
                    initialTask: "\(escapedItem)"
                });
            } else {
                window.dispatchEvent(new CustomEvent('minestCardCreated', {
                    detail: { id: '\(id)', title: "\(escapedTitle)", category: "\(escapedCat)", item: "\(escapedItem)" }
                }));
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
