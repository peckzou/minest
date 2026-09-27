import Foundation
import WebKit
import UIKit

/// Message protocol received from JavaScript
public struct NativeBridgeMessage: Codable {
    public let action: String
    public let boardTitle: String?
    public let cardTitle: String?
    public let totalCards: Int?
    public let completedCards: Int?
    public let totalCount: Int?
    public let completedCount: Int?
    public let remainingMinutes: Int?
    public let currentCardTitle: String?
    public let itemText: String?
    public let isAllDone: Bool?
    public let hapticStyle: String?
}

/// Thin Swift Bridge listening to window.webkit.messageHandlers.minestBridge
public final class MinestBridge: NSObject, WKScriptMessageHandler {
    public static let primaryHandlerName = "minestBridge"
    public static let legacyHandlerName = "focusboardBridge"
    public weak var webView: WKWebView?
    
    public override init() {
        super.init()
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
        case "checklistUpdated", "checklistToggled":
            let cardTitle = data["cardTitle"] as? String ?? "Checklist"
            let completed = data["completedCount"] as? Int ?? (data["completedCards"] as? Int ?? 0)
            let total = data["totalCount"] as? Int ?? (data["totalCards"] as? Int ?? 1)
            let itemText = data["itemText"] as? String ?? ""
            let isAllDone = data["isAllDone"] as? Bool ?? (completed == total && total > 0)
            
            print("☑️ [MinestBridge] Checklist Toggled: \(cardTitle) -> \(completed)/\(total) items (\(itemText))")
            LiveActivityManager.shared.updateChecklist(
                boardTitle: boardTitle,
                cardTitle: cardTitle,
                completedCount: completed,
                totalCount: total,
                itemText: itemText,
                isAllDone: isAllDone
            )
            triggerHaptic(style: isAllDone ? "success" : "selection")
            
        case "studyStarted":
            print("📖 [MinestBridge] Study Started: \(boardTitle), total: \(totalCards)")
            LiveActivityManager.shared.startStudySession(
                boardTitle: boardTitle,
                totalCards: totalCards,
                completedCards: completedCards,
                remainingMinutes: remainingMinutes,
                currentCardTitle: currentCardTitle
            )
            triggerHaptic(style: "medium")
            
        case "progressUpdated":
            print("🎯 [MinestBridge] Progress Updated: \(completedCards)/\(totalCards)")
            LiveActivityManager.shared.updateProgress(
                completedCards: completedCards,
                totalCards: totalCards,
                remainingMinutes: remainingMinutes,
                currentCardTitle: currentCardTitle
            )
            triggerHaptic(style: "selection")
            
        case "studyFinished":
            print("🏆 [MinestBridge] Study Finished!")
            LiveActivityManager.shared.endStudySession(dismissImmediately: false)
            triggerHaptic(style: "success")
            
        case "studyPaused":
            LiveActivityManager.shared.updateProgress(
                completedCards: completedCards,
                isPaused: true
            )
            
        case "triggerHaptic":
            let style = data["style"] as? String ?? "light"
            triggerHaptic(style: style)
            
        default:
            print("ℹ️ [MinestBridge] Unhandled action: \(action)")
        }
    }
    
    private func triggerHaptic(style: String) {
        switch style {
        case "light":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "medium":
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "heavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "selection":
            UISelectionFeedbackGenerator().selectionChanged()
        case "success":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        default:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
    }
    
    /// Send an event back to JS
    public func sendEventToWeb(event: String, payload: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }
        
        let js = "window.__minestNative?.onNativeEvent('\(event)', \(jsonString)); window.__focusboardNative?.onNativeEvent('\(event)', \(jsonString));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
