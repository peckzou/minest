import Foundation
import ActivityKit
import Combine
import SwiftUI
import UIKit
import WebKit

/// Manages the lifecycle of Minest Checklist & Study Live Activity & Dynamic Island sessions.
@MainActor
public final class LiveActivityManager: ObservableObject {
    public static let shared = LiveActivityManager()
    
    @Published public private(set) var currentActivity: Activity<StudyActivityAttributes>?
    @Published public private(set) var isActivityActive: Bool = false
    
    // Debounce work item to prevent ActivityKit throttling on rapid checklist toggles
    private var debounceWorkItem: DispatchWorkItem?
    private var ringsWorkItem: DispatchWorkItem?

    // Latest Three Rings state from the web app / watch (persisted so a fresh activity starts correct)
    private let ringsKey = "minest_live_rings_snapshot_v1"
    public private(set) var latestRings: StudyActivityAttributes.RingsSnapshot = StudyActivityAttributes.RingsSnapshot()

    // Dynamic Island focus timer: Stop is committed to the web Focus ring exactly once
    public weak var bridge: MinestBridge?
    private let committedTimerKey = "minest_live_timer_committed_v1"
    private var observedActivityId: String?
    // Shared focus timer with the watch: last state exchanged (echo guard) and a pending one
    private var lastSyncedTimer: StudyActivityAttributes.FocusTimerState?
    private var hasSyncedTimer = false
    private var pendingTimer: StudyActivityAttributes.FocusTimerState?
    private var activeObserver: NSObjectProtocol?
    
    private init() {
        if let data = UserDefaults.standard.data(forKey: ringsKey),
           let saved = try? JSONDecoder().decode(StudyActivityAttributes.RingsSnapshot.self, from: data) {
            latestRings = saved
        }
        restoreActiveActivity()
        activeObserver = NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in
            Task { @MainActor in LiveActivityManager.shared.commitStoppedTimerIfNeeded() }
        }
    }

    /// Watch the active activity for timer changes made from the Dynamic Island buttons.
    public func observeTimer() {
        guard let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }),
              observedActivityId != activity.id else { commitStoppedTimerIfNeeded(); return }
        observedActivityId = activity.id
        Task { @MainActor in
            for await _ in activity.contentUpdates {
                LiveActivityManager.shared.sendTimerToWatch()
                LiveActivityManager.shared.commitStoppedTimerIfNeeded()
            }
        }
        commitStoppedTimerIfNeeded()
    }

    /// Timer payload for the watch: running / paused / ended (ended = stopped or cleared here).
    private func timerPayload(_ timer: StudyActivityAttributes.FocusTimerState?) -> [String: Any] {
        guard let t = timer, t.stoppedSeconds == nil else {
            return ["state": "ended", "sessionId": timer?.sessionId ?? lastSyncedTimer?.sessionId ?? "", "updatedAt": Date().timeIntervalSince1970]
        }
        return [
            "state": t.isRunning ? "running" : "paused",
            "sessionId": t.sessionId,
            "runningSince": t.runningSince?.timeIntervalSince1970 ?? 0,
            "accumulated": t.accumulated,
            "updatedAt": Date().timeIntervalSince1970
        ]
    }

    /// Forward the island timer to the watch when it changed (or always when asked).
    public func sendTimerToWatch(force: Bool = false) {
        let current = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active })?.content.state.timer
        let normalized = (current?.stoppedSeconds == nil) ? current : nil
        if !force && hasSyncedTimer && normalized == lastSyncedTimer { return }
        // Nothing to say when no timer has ever run
        if !force && !hasSyncedTimer && normalized == nil { return }
        lastSyncedTimer = normalized
        hasSyncedTimer = true
        pendingTimer = normalized
        iPhoneWatchSyncManager.shared.sendFocusTimerToWatch(timerPayload(current))
    }

    /// 31.6: Home Screen quick action — start (or resume) the shared focus timer
    /// on the Dynamic Island, creating the Live Activity first when none is running.
    public func startFocusTimerFromShortcut() {
        if Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }) == nil {
            startStudySession(boardTitle: "Minest", totalCards: 0)
        }
        Task {
            // Give a freshly requested activity a moment to become active.
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }) else { return }
            var state = activity.content.state
            var timer = state.timer ?? StudyActivityAttributes.FocusTimerState()
            if timer.stoppedSeconds != nil { timer = StudyActivityAttributes.FocusTimerState() }
            if timer.runningSince == nil { timer.runningSince = Date() }
            state.timer = timer
            await activity.update(ActivityContent(state: state, staleDate: nil))
            await MainActor.run { LiveActivityManager.shared.sendTimerToWatch(force: true) }
        }
    }

    /// Apply a timer change made on the watch to the Dynamic Island (no echo back).
    public func applyWatchTimer(_ payload: [String: Any]) {
        let state = payload["state"] as? String ?? "ended"
        var timer: StudyActivityAttributes.FocusTimerState? = nil
        if state == "running" || state == "paused" {
            let since = payload["runningSince"] as? Double ?? 0
            timer = StudyActivityAttributes.FocusTimerState(
                sessionId: payload["sessionId"] as? String ?? UUID().uuidString,
                runningSince: (state == "running" && since > 0) ? Date(timeIntervalSince1970: since) : nil,
                accumulated: payload["accumulated"] as? Double ?? 0
            )
        }
        // The watch commits its own minutes on End, so the island just clears
        lastSyncedTimer = timer
        hasSyncedTimer = true
        pendingTimer = timer
        guard let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }) else { return }
        var content = activity.content.state
        content.timer = timer
        Task { await activity.update(ActivityContent(state: content, staleDate: nil)) }
    }

    /// Hand a stopped island timer to the web app (which owns the Three Rings) and reset the timer.
    public func commitStoppedTimerIfNeeded() {
        guard let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }),
              let timer = activity.content.state.timer,
              let seconds = timer.stoppedSeconds,
              let webView = bridge?.webView else { return }
        let committed = UserDefaults.standard.string(forKey: committedTimerKey)
        if committed != timer.sessionId {
            UserDefaults.standard.set(timer.sessionId, forKey: committedTimerKey)
            let minutes = Int(seconds / 60)
            let js = "window.dispatchEvent(new CustomEvent('minestFocusSessionCommitted', { detail: { minutes: \(minutes), seconds: \(Int(seconds)), source: 'island' } }));"
            webView.evaluateJavaScript(js, completionHandler: nil)
            print("⏱ [LiveActivityManager] Island focus session committed: \(minutes) min")
        }
        var state = activity.content.state
        state.timer = nil
        Task { await activity.update(ActivityContent(state: state, staleDate: nil)) }
    }

    /// Update the Three Rings shown on the Dynamic Island. Progress uses the same
    /// value / target ratios as the web rings; strike = qualified ring days.
    public func updateRings(focusMinutes: Int, targetMinutes: Int, checkCount: Int, targetChecks: Int,
                            goalPercent: Int, targetGoalPercent: Int, strikeDays: Int?) {
        var snapshot = StudyActivityAttributes.RingsSnapshot(
            focus: targetMinutes > 0 ? Double(focusMinutes) / Double(targetMinutes) : 0,
            complete: targetChecks > 0 ? Double(checkCount) / Double(targetChecks) : 0,
            goal: targetGoalPercent > 0 ? Double(goalPercent) / Double(targetGoalPercent) : 0,
            strikeDays: strikeDays ?? latestRings.strikeDays
        )
        snapshot.focusMinutes = focusMinutes
        snapshot.targetMinutes = targetMinutes
        snapshot.checkCount = checkCount
        snapshot.targetChecks = targetChecks
        snapshot.goalPercent = goalPercent
        snapshot.targetGoalPercent = targetGoalPercent
        guard snapshot != latestRings else { return }
        latestRings = snapshot
        if let data = try? JSONEncoder().encode(snapshot) {
            UserDefaults.standard.set(data, forKey: ringsKey)
        }

        guard let activity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active }) else { return }
        var state = activity.content.state
        state.rings = snapshot
        let content = ActivityContent(state: state, staleDate: nil)
        ringsWorkItem?.cancel()
        let work = DispatchWorkItem {
            Task { await activity.update(content) }
        }
        ringsWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3, execute: work)
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
        
        // 31.6: the Home Screen widget mirrors the home list only (updateHomeList),
        // so a card's sub-checklist shown on the island no longer replaces it.
        
        var state = StudyActivityAttributes.ContentState(
            completedCount: completedCount,
            totalCount: totalCount,
            cardTitle: cardTitle,
            itemText: itemText,
            mode: "checklist",
            remainingMinutes: 0,
            isAllDone: isAllDone,
            items: items
        )
        state.rings = latestRings
        // Find existing active activity
        let activeActivity = Activity<StudyActivityAttributes>.activities.first(where: { $0.activityState == .active })
        state.timer = activeActivity?.content.state.timer ?? pendingTimer
        let content = ActivityContent(state: state, staleDate: nil)
        
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
                observeTimer()
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
        var initialContentState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards,
            remainingMinutes: remainingMinutes,
            currentCardTitle: currentCardTitle,
            isPaused: false
        )
        initialContentState.rings = latestRings
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
        var updatedState = StudyActivityAttributes.ContentState(
            completedCards: completedCards,
            totalCards: totalCards ?? currentState.totalCards,
            remainingMinutes: remainingMinutes ?? currentState.remainingMinutes,
            currentCardTitle: currentCardTitle ?? currentState.currentCardTitle,
            isPaused: isPaused ?? currentState.isPaused
        )
        updatedState.rings = latestRings
        updatedState.timer = currentState.timer
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
