import SwiftUI
import WatchKit
import WatchConnectivity

// MARK: - Watch 4.0: Change ring goals (Apple Fitness "Change Goal" style)
//
// Crown down from the rings page: Focus minutes → Complete count → Goal %.
// Tap the number to hand the Digital Crown to the value (green focus outline),
// or use − / +. "更新" saves the goal locally and mirrors it to the phone.

enum RingGoalKind {
    case focus, complete, goal

    var ring: FitnessRingKind {
        switch self {
        case .focus: return .focus
        case .complete: return .checks
        case .goal: return .goal
        }
    }

    var title: String {
        switch self {
        case .focus: return "专注目标"
        case .complete: return "完成目标"
        case .goal: return "目标百分比"
        }
    }

    var subtitle: String {
        switch self {
        case .focus: return "FOCUS"
        case .complete: return "COMPLETE"
        case .goal: return "GOAL"
        }
    }

    var unit: String {
        switch self {
        case .focus: return "分钟/天"
        case .complete: return "次/天"
        case .goal: return "%/天"
        }
    }

    var range: ClosedRange<Double> {
        switch self {
        case .focus: return 5...240
        case .complete: return 1...50
        case .goal: return 10...100
        }
    }

    var step: Double {
        switch self {
        case .focus: return 5
        case .complete: return 1
        case .goal: return 5
        }
    }
}

/// Ignore goal echoes from the phone right after the wearer changes a goal on the watch.
enum RingGoalSyncGuard {
    static var lastWatchEdit: Date?
    static var recentlyEditedOnWatch: Bool {
        guard let t = lastWatchEdit else { return false }
        return Date().timeIntervalSince(t) < 90
    }
}

extension WatchSyncManager {
    func ringGoalValue(_ kind: RingGoalKind) -> Int {
        switch kind {
        case .focus: return ringsState.targetMinutes
        case .complete: return ringsState.targetChecks
        case .goal: return ringsState.goalTarget
        }
    }

    func ringProgressValue(_ kind: RingGoalKind) -> Int {
        switch kind {
        case .focus: return ringsState.focusMinutes
        case .complete: return ringsState.checkCount
        case .goal: return ringsState.goalPercent
        }
    }

    /// Save one ring goal on the watch and mirror all goals to the phone.
    func updateRingGoal(_ kind: RingGoalKind, value: Int) {
        switch kind {
        case .focus: ringsState.targetMinutes = value
        case .complete: ringsState.targetChecks = value
        case .goal: ringsState.targetGoalPercent = value
        }
        RingGoalSyncGuard.lastWatchEdit = Date()
        checkBadgeUnlocks()
        saveLocalCache()

        let message: [String: Any] = [
            "action": "updateRingGoals",
            "targetMinutes": ringsState.targetMinutes,
            "targetChecks": ringsState.targetChecks,
            "targetGoalPercent": ringsState.goalTarget
        ]
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { _ in
                try? WCSession.default.updateApplicationContext(message)
            }
        } else {
            try? WCSession.default.updateApplicationContext(message)
        }
    }
}

// MARK: - One goal page

struct WatchRingGoalPage: View {
    let kind: RingGoalKind
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @State private var draft: Double = 0
    @State private var didLoad = false
    @State private var savedFlash = false
    @FocusState private var crownOnValue: Bool
    // Only focusable while editing, so the crown pages by default
    @State private var editing = false

    private var saved: Int { syncManager.ringGoalValue(kind) }
    private var color: Color { kind.ring.colors[1] }

    var body: some View {
        VStack(spacing: 4) {
            // Header: live ring preview against the draft goal
            HStack(spacing: 6) {
                FitnessRing(
                    kind: kind.ring,
                    progress: Double(syncManager.ringProgressValue(kind)) / max(draft, 1),
                    lineWidth: 5
                )
                .padding(2.5)
                .frame(width: 24, height: 24)
                VStack(alignment: .leading, spacing: 0) {
                    Text(kind.title)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundColor(color)
                    Text(kind.subtitle)
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 4)

            Spacer(minLength: 2)

            // − value +
            HStack(spacing: 6) {
                stepButton(symbol: "minus", delta: -kind.step)

                VStack(spacing: 0) {
                    Text("\(Int(draft))")
                        .font(.system(size: 44, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(color)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .contentTransition(.numericText())
                        .animation(.snappy(duration: 0.2), value: draft)
                    Text(kind.unit)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.8))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(crownOnValue ? Color(hex: "#30D158") : .clear, lineWidth: 2)
                )
                .contentShape(Rectangle())
                .focusable(editing)
                .focused($crownOnValue)
                .digitalCrownRotation(
                    $draft,
                    from: kind.range.lowerBound,
                    through: kind.range.upperBound,
                    by: kind.step,
                    sensitivity: .medium,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
                .onTapGesture {
                    if editing {
                        crownOnValue = false
                        editing = false
                    } else {
                        editing = true
                        DispatchQueue.main.async { crownOnValue = true }
                    }
                }
                .onChange(of: crownOnValue) { focused in
                    if !focused { editing = false }
                }

                stepButton(symbol: "plus", delta: kind.step)
            }

            Text(Int(draft) == saved ? (savedFlash ? "已更新 ✓" : "当前目标") : "当前 \(saved)")
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundColor(savedFlash ? color : .secondary)

            Spacer(minLength: 2)

            Button(action: commit) {
                Text("更新")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(Int(draft) == saved ? .white.opacity(0.4) : .black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 34)
                    .background(
                        Capsule().fill(Int(draft) == saved ? Color.white.opacity(0.12) : color)
                    )
            }
            .buttonStyle(.plain)
            .disabled(Int(draft) == saved)
        }
        .padding(.horizontal, 2)
        .onAppear {
            if !didLoad {
                draft = Double(saved)
                didLoad = true
            }
        }
        .onChange(of: saved) { newValue in
            // Goal changed elsewhere (another page / phone): follow it unless mid-edit
            if !editing { draft = Double(newValue) }
        }
    }

    private func stepButton(symbol: String, delta: Double) -> some View {
        Button {
            let next = min(max(draft + delta, kind.range.lowerBound), kind.range.upperBound)
            if next != draft {
                draft = next
                WKInterfaceDevice.current().play(.click)
            }
        } label: {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 34, height: 34)
                .background(Circle().fill(Color.white.opacity(0.16)))
        }
        .buttonStyle(.plain)
    }

    private func commit() {
        syncManager.updateRingGoal(kind, value: Int(draft))
        crownOnValue = false
        editing = false
        WKInterfaceDevice.current().play(.success)
        savedFlash = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { savedFlash = false }
    }
}
