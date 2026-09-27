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
    
    // Debounce work item to prevent ActivityKit throttling on rapid checklist toggles
    private var debounceWorkItem: DispatchWorkItem?
    
    private init() {
        restoreActiveActivity()
    }
    
    /// Checks and attaches to any active Live Activity
    public func restoreActiveActivity() {
        self.currentActivity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active })
        self.isActivityActive = self.currentActivity != nil
        print("📱 [LiveActivityManager] Restore - Active activity: \(self.currentActivity?.id ?? "none"), areActivitiesEnabled: \(ActivityAuthorizationInfo().areActivitiesEnabled)")
    }
    
    /// Updates Live Activity specifically for tracking the active vertical/portrait list on Dynamic Island
    public func updateActiveList(
        boardTitle: String = "Minest",
        listName: String,
        completedCards: Int,
        totalCards: Int,
        items: [StudyActivityAttributes.ChecklistItemState] = []
    ) {
        let isAllDone = (completedCards >= totalCards && totalCards > 0)
        updateChecklist(
            boardTitle: boardTitle,
            cardTitle: listName,
            completedCount: completedCards,
            totalCount: totalCards,
            itemText: listName,
            isAllDone: isAllDone,
            items: items
        )
    }
    
    /// Updates or starts a Live Activity specifically for Checklist progress on Dynamic Island
    public func updateChecklist(
        boardTitle: String = "Minest",
        cardTitle: String,
        completedCount: Int,
        totalCount: Int,
        itemText: String = "",
        isAllDone: Bool = false,
        items: [StudyActivityAttributes.ChecklistItemState] = []
    ) {
        let authEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
        guard authEnabled else {
            print("⚠️ [LiveActivityManager] Live Activities are disabled in iOS Settings.")
            return
        }
        
        // Sync with Home Screen Widget Data Store
        if !items.isEmpty {
            MinestWidgetDataStore.shared.saveItems(items, boardTitle: boardTitle, cardTitle: cardTitle)
        }
        
        let state = StudyActivityAttributes.ContentState(
            completedCount: completedCount,
            totalCount: totalCount,
            cardTitle: cardTitle,
            itemText: itemText,
            mode: "checklist",
            remainingMinutes: 0,
            isAllDone: isAllDone,
            items: items
        )
        let content = ActivityContent(state: state, staleDate: nil)
        
        // Find existing active activity
        let activeActivity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active })
        
        if let activity = activeActivity {
            self.currentActivity = activity
            self.isActivityActive = true
            
            // Debounce rapid updates by 200ms to stay within iOS rate limits
            debounceWorkItem?.cancel()
            let workItem = DispatchWorkItem { [weak self] in
                Task {
                    await activity.update(content)
                    print("✅ [LiveActivityManager] Debounced update on Dynamic Island: \(cardTitle) (\(completedCount)/\(totalCount))")
                }
            }
            self.debounceWorkItem = workItem
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2, execute: workItem)
        } else {
            // Cancel pending debounce
            debounceWorkItem?.cancel()
            
            // Clean up any stale or ended activities
            for act in Activity<StudyActivityAttributes>.activities {
                Task {
                    await act.end(nil, dismissalPolicy: .immediate)
                }
            }
            
            // Start a new live activity immediately
            let attributes = StudyActivityAttributes(boardTitle: boardTitle)
            do {
                let activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
                self.currentActivity = activity
                self.isActivityActive = true
                print("🚀 [LiveActivityManager] Successfully requested NEW Checklist Live Activity: \(activity.id)")
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
        
        endStudySession(dismissImmediately: true)
        
        let attributes = StudyActivityAttributes(boardTitle: boardTitle)
        let initialContentState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards,
            remainingMinutes: remainingMinutes,
            currentCardTitle: currentCardTitle,
            isPaused: false
        )
        let activityContent = ActivityContent(state: initialContentState, staleDate: nil)
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: activityContent,
                pushType: nil
            )
            self.currentActivity = activity
            self.isActivityActive = true
            print("✅ [LiveActivityManager] Started Live Activity: \(activity.id)")
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
        guard let activity = currentActivity, activity.activityState == .active else {
            print("ℹ️ [LiveActivityManager] No active activity to update.")
            return
        }
        
        let currentState = activity.content.state
        let updatedState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards ?? currentState.totalCards,
            remainingMinutes: remainingMinutes ?? currentState.remainingMinutes,
            currentCardTitle: currentCardTitle ?? currentState.currentCardTitle,
            isPaused: isPaused ?? currentState.isPaused
        )
        let content = ActivityContent(state: updatedState, staleDate: nil)
        
        Task {
            await activity.update(content)
            print("🔄 [LiveActivityManager] Updated Live Activity: \(completedCards)/\(updatedState.totalCards) cards")
        }
    }
    
    /// Finishes or dismisses the study session
    public func endStudySession(dismissImmediately: Bool = false) {
        debounceWorkItem?.cancel()
        guard let activity = currentActivity else { return }
        
        let finalState = activity.content.state
        let finalContent = ActivityContent(state: finalState, staleDate: nil)
        let dismissalPolicy: ActivityUIDismissalPolicy = dismissImmediately ? .immediate : .after(Date().addingTimeInterval(3.0))
        
        Task {
            await activity.end(finalContent, dismissalPolicy: dismissalPolicy)
            await MainActor.run {
                self.currentActivity = nil
                self.isActivityActive = false
            }
            print("🏁 [LiveActivityManager] Ended Live Activity")
        }
    }
    
    /// Cleanly terminates all activities (for example when user ends session)
    public func endAllActivities() {
        debounceWorkItem?.cancel()
        for act in Activity<StudyActivityAttributes>.activities {
            Task {
                await act.end(nil, dismissalPolicy: .immediate)
            }
        }
        self.currentActivity = nil
        self.isActivityActive = false
    }
}
