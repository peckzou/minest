import Foundation
import ActivityKit
import Combine
import SwiftUI

/// Manages the lifecycle of Minest Checklist & Study Live Activity & Dynamic Island sessions.
@MainActor
public final class LiveActivityManager: ObservableObject {
    public static let shared = LiveActivityManager()
    
    @Published public private(set) var currentActivity: Activity<StudyActivityAttributes>?
    @Published public private(set) var isActivityActive: Bool = false
    
    private init() {
        // Re-attach to any existing running activity if app was relaunched
        self.currentActivity = Activity<StudyActivityAttributes>.activities.first
        self.isActivityActive = self.currentActivity != nil
    }
    
    /// Updates or starts a Live Activity specifically for Checklist progress on Dynamic Island
    public func updateChecklist(
        boardTitle: String = "Minest",
        cardTitle: String,
        completedCount: Int,
        totalCount: Int,
        itemText: String = "",
        isAllDone: Bool = false
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("⚠️ [LiveActivityManager] Live Activities are disabled.")
            return
        }
        
        let state = StudyActivityAttributes.ContentState(
            completedCount: completedCount,
            totalCount: totalCount,
            cardTitle: cardTitle,
            itemText: itemText,
            mode: "checklist",
            remainingMinutes: 0,
            isAllDone: isAllDone
        )
        
        if let activity = currentActivity {
            // Update existing live activity
            Task {
                if #available(iOS 16.2, *) {
                    await activity.update(ActivityContent(state: state, staleDate: nil))
                } else {
                    await activity.update(using: state)
                }
                print("✅ [LiveActivityManager] Updated Checklist on Dynamic Island: \(cardTitle) (\(completedCount)/\(totalCount))")
            }
        } else {
            // Start a new live activity for this checklist
            let attributes = StudyActivityAttributes(boardTitle: boardTitle)
            do {
                if #available(iOS 16.2, *) {
                    let content = ActivityContent(state: state, staleDate: nil)
                    let activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
                    self.currentActivity = activity
                    self.isActivityActive = true
                    print("🚀 [LiveActivityManager] Started Checklist Live Activity on Dynamic Island: \(activity.id)")
                } else {
                    let activity = try Activity.request(attributes: attributes, contentState: state, pushType: nil)
                    self.currentActivity = activity
                    self.isActivityActive = true
                    print("🚀 [LiveActivityManager] Started Checklist Live Activity (iOS 16.1): \(activity.id)")
                }
            } catch {
                print("❌ [LiveActivityManager] Failed to start Live Activity: \(error.localizedDescription)")
            }
        }
    }
    
    /// Starts a new Study Session on Dynamic Island & Lock Screen
    public func startStudySession(
        boardTitle: String,
        totalCards: Int,
        completedCards: Int = 0,
        remainingMinutes: Int = 15,
        currentCardTitle: String = ""
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("⚠️ [LiveActivityManager] Live Activities are disabled by user or system.")
            return
        }
        
        // End existing sessions before starting a fresh one
        endStudySession()
        
        let attributes = StudyActivityAttributes(boardTitle: boardTitle)
        let initialContentState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards,
            remainingMinutes: remainingMinutes,
            currentCardTitle: currentCardTitle,
            isPaused: false
        )
        
        do {
            if #available(iOS 16.2, *) {
                let activityContent = ActivityContent(state: initialContentState, staleDate: nil)
                let activity = try Activity.request(
                    attributes: attributes,
                    content: activityContent,
                    pushType: nil
                )
                self.currentActivity = activity
                self.isActivityActive = true
                print("✅ [LiveActivityManager] Started Live Activity: \(activity.id)")
            } else {
                let activity = try Activity.request(
                    attributes: attributes,
                    contentState: initialContentState,
                    pushType: nil
                )
                self.currentActivity = activity
                self.isActivityActive = true
                print("✅ [LiveActivityManager] Started Live Activity (iOS 16.1): \(activity.id)")
            }
        } catch {
            print("❌ [LiveActivityManager] Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    /// Updates live progress (e.g., card completed, remaining time updated)
    public func updateProgress(
        completedCards: Int,
        totalCards: Int? = nil,
        remainingMinutes: Int? = nil,
        currentCardTitle: String? = nil,
        isPaused: Bool? = nil
    ) {
        guard let activity = currentActivity else {
            print("ℹ️ [LiveActivityManager] No active activity to update.")
            return
        }
        
        let currentState = activity.contentState
        let updatedState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards ?? currentState.totalCards,
            remainingMinutes: remainingMinutes ?? currentState.remainingMinutes,
            currentCardTitle: currentCardTitle ?? currentState.currentCardTitle,
            isPaused: isPaused ?? currentState.isPaused
        )
        
        Task {
            if #available(iOS 16.2, *) {
                let content = ActivityContent(state: updatedState, staleDate: nil)
                await activity.update(content)
            } else {
                await activity.update(using: updatedState)
            }
            print("🔄 [LiveActivityManager] Updated Live Activity: \(completedCards)/\(updatedState.totalCards) cards")
        }
    }
    
    /// Finishes or dismisses the study session
    public func endStudySession(dismissImmediately: Bool = false) {
        guard let activity = currentActivity else { return }
        
        let finalState = activity.contentState
        let dismissalPolicy: ActivityUIDismissalPolicy = dismissImmediately ? .immediate : .after(Date().addingTimeInterval(3.0))
        
        Task {
            if #available(iOS 16.2, *) {
                let finalContent = ActivityContent(state: finalState, staleDate: nil)
                await activity.end(finalContent, dismissalPolicy: dismissalPolicy)
            } else {
                await activity.end(using: finalState, dismissalPolicy: dismissalPolicy)
            }
            self.currentActivity = nil
            self.isActivityActive = false
            print("🏁 [LiveActivityManager] Ended Live Activity")
        }
    }
}
