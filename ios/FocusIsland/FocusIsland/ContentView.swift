import SwiftUI
import ActivityKit

struct ContentView: View {
    // In-memory simple state
    @State private var completed: Int = 0
    @State private var total: Int = 20
    @State private var title: String = "English / EC-6"
    @State private var currentActivity: Activity<FocusActivityAttributes>? = nil
    @State private var statusMessage: String = "Ready"
    @State private var timer: Timer? = nil
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                // Header & Info Card
                VStack(spacing: 12) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 40))
                        .foregroundColor(.green)
                    
                    Text("FocusIsland Prototype")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("SwiftUI App → ActivityKit → Dynamic Island")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Live Activity Status & Progress Card
                VStack(spacing: 14) {
                    HStack {
                        Text("Current State")
                            .font(.headline)
                        Spacer()
                        Text(currentActivity != nil ? "● Active" : "○ Inactive")
                            .font(.subheadline)
                            .foregroundColor(currentActivity != nil ? .green : .secondary)
                            .bold()
                    }
                    
                    Divider()
                    
                    HStack {
                        Text("Deck:")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(title)
                            .fontWeight(.medium)
                    }
                    
                    HStack {
                        Text("Completed Cards:")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(completed) / \(total)")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.green)
                    }
                    
                    ProgressView(value: Double(completed), total: Double(max(total, 1)))
                        .tint(.green)
                    
                    Text(statusMessage)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(20)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(16)
                .padding(.horizontal)
                
                // 3 Action Buttons
                VStack(spacing: 14) {
                    // 1. Start Focus
                    Button(action: startFocus) {
                        HStack {
                            Image(systemName: "play.fill")
                            Text("Start Focus")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    
                    // 2. Complete Card
                    Button(action: completeCard) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Complete Card")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(currentActivity != nil ? Color.blue : Color.gray.opacity(0.4))
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    .disabled(currentActivity == nil)
                    
                    // 3. End Focus
                    Button(action: endFocus) {
                        HStack {
                            Image(systemName: "stop.fill")
                            Text("End Focus")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(currentActivity != nil ? Color.red : Color.gray.opacity(0.4))
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    .disabled(currentActivity == nil)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("FocusIsland")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                checkExistingActivity()
                handleCommandLineArgs()
                startCommandFilePolling()
            }
            .onOpenURL { url in
                let host = url.host ?? ""
                let path = url.path.replacingOccurrences(of: "/", with: "")
                let action = host.isEmpty ? path : host
                print("Received URL: \(url), action: \(action)")
                handleAction(action)
            }
        }
    }
    
    // MARK: - Actions
    
    private func handleAction(_ action: String) {
        if action == "start" || action == "startFocus" {
            startFocus()
        } else if action == "complete" || action == "completeCard" {
            completeCard()
        } else if action == "end" || action == "endFocus" {
            endFocus()
        }
    }
    
    private func handleCommandLineArgs() {
        if CommandLine.arguments.contains("--start-focus") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.startFocus()
            }
        } else if CommandLine.arguments.contains("--complete-card") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.completeCard()
            }
        } else if CommandLine.arguments.contains("--end-focus") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.endFocus()
            }
        }
    }
    
    private func getCommandFileURL() -> URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent("focusisland_command.txt")
    }
    
    private func startCommandFilePolling() {
        guard let fileURL = getCommandFileURL() else { return }
        print("Command file path: \(fileURL.path)")
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            if FileManager.default.fileExists(atPath: fileURL.path) {
                if let content = try? String(contentsOf: fileURL, encoding: .utf8) {
                    let cmd = content.trimmingCharacters(in: .whitespacesAndNewlines)
                    try? FileManager.default.removeItem(at: fileURL)
                    print("Executing polled command: \(cmd)")
                    self.handleAction(cmd)
                }
            }
        }
    }
    
    private func checkExistingActivity() {
        if let existing = Activity<FocusActivityAttributes>.activities.first {
            self.currentActivity = existing
            self.completed = existing.content.state.completed
            self.total = existing.content.state.total
            self.title = existing.content.state.title
            self.statusMessage = "Attached to running Live Activity"
            print("Found existing Live Activity: \(existing.id) completed=\(self.completed)")
        }
    }
    
    private func startFocus() {
        // End any existing activities first
        for act in Activity<FocusActivityAttributes>.activities {
            Task {
                await act.end(nil, dismissalPolicy: .immediate)
            }
        }
        
        completed = 0
        total = 20
        title = "English / EC-6"
        
        let initialState = FocusActivityAttributes.ContentState(
            title: title,
            completed: completed,
            total: total
        )
        let attributes = FocusActivityAttributes(sessionName: "Focusboard")
        let activityContent = ActivityContent(state: initialState, staleDate: nil)
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: activityContent,
                pushType: nil
            )
            self.currentActivity = activity
            self.statusMessage = "Live Activity started! (📚 0/20)"
            print("Successfully requested Live Activity: \(activity.id)")
        } catch {
            self.statusMessage = "Start failed: \(error.localizedDescription)"
            print("Failed to start Live Activity: \(error)")
        }
    }
    
    private func completeCard() {
        if currentActivity == nil {
            checkExistingActivity()
        }
        
        guard let activity = currentActivity else {
            statusMessage = "No active Live Activity"
            print("Cannot complete card: No active activity")
            return
        }
        
        completed += 1
        let updatedState = FocusActivityAttributes.ContentState(
            title: title,
            completed: completed,
            total: total
        )
        let updatedContent = ActivityContent(state: updatedState, staleDate: nil)
        
        Task {
            await activity.update(updatedContent)
            await MainActor.run {
                self.statusMessage = "Updated: 📚 \(completed)/\(total)"
            }
            print("Updated Live Activity to completed=\(completed)")
        }
    }
    
    private func endFocus() {
        if currentActivity == nil {
            checkExistingActivity()
        }
        
        guard let activity = currentActivity else {
            print("Cannot end focus: No active activity")
            return
        }
        
        let finalState = FocusActivityAttributes.ContentState(
            title: title,
            completed: completed,
            total: total
        )
        let finalContent = ActivityContent(state: finalState, staleDate: nil)
        
        Task {
            await activity.end(finalContent, dismissalPolicy: .immediate)
            await MainActor.run {
                self.currentActivity = nil
                self.completed = 0
                self.statusMessage = "Live Activity ended"
            }
            print("Ended Live Activity")
        }
    }
}
