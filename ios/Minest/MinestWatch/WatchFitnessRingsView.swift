import SwiftUI
import WatchKit
import WatchConnectivity
import Combine

// MARK: - Minest Watch 4.0: Apple Fitness style rings + swipe-right focus workout
//
// Rings page (Fitness replica) → swipe right on the rings → 3·2·1 countdown →
// Workout-style session (metrics page, swipe right for End / Pause controls) → summary.
// Finished focus time is committed to Ring 1 and pushed to the phone.

public enum MinestWatchVersion {
    public static let label = "Watch 4.4"
}

// MARK: - Ring palette (Minest colors, Apple Fitness gradients)

enum FitnessRingKind: CaseIterable {
    case focus, checks, goal

    var colors: [Color] {
        switch self {
        case .focus:  return [Color(hex: "#E3004D"), Color(hex: "#FA114F"), Color(hex: "#FF5D8F")]
        case .checks: return [Color(hex: "#1FB84A"), Color(hex: "#30D158"), Color(hex: "#9CFF6B")]
        case .goal:   return [Color(hex: "#00B8D9"), Color(hex: "#00E5FF"), Color(hex: "#7DFFF5")]
        }
    }

    var symbol: String {
        switch self {
        case .focus:  return "arrow.right"
        case .checks: return "chevron.right.2"
        case .goal:   return "arrow.up"
        }
    }

    var title: String {
        switch self {
        case .focus:  return "专注"
        case .checks: return "打勾"
        case .goal:   return "目标"
        }
    }
}

// MARK: - Single ring (track, gradient arc, overflow lap, end-cap shadow, start glyph)

struct FitnessRing: View {
    let kind: FitnessRingKind
    let progress: Double
    let lineWidth: CGFloat

    var body: some View {
        let p = max(progress, 0)
        let firstLap = min(p, 1)
        let overflow = p > 1 ? min(p - 1, 1) : 0

        ZStack {
            Group {
                // Dim track
                Circle()
                    .stroke(kind.colors[1].opacity(0.22), lineWidth: lineWidth)

                // First lap with angular gradient
                Circle()
                    .trim(from: 0, to: CGFloat(firstLap))
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: kind.colors),
                            center: .center,
                            startAngle: .degrees(0),
                            endAngle: .degrees(360 * max(firstLap, 0.001))
                        ),
                        style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                    )

                // Second lap (>100%) drawn in the bright tone
                if overflow > 0 {
                    Circle()
                        .trim(from: 0, to: CGFloat(overflow))
                        .stroke(kind.colors[2], style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                }

                // End cap with shadow once the arc closes on itself
                if p > 0.94 {
                    GeometryReader { geo in
                        let r = min(geo.size.width, geo.size.height) / 2
                        let angle = Angle.degrees(360 * (overflow > 0 ? overflow : firstLap))
                        Circle()
                            .fill(kind.colors[2])
                            .frame(width: lineWidth, height: lineWidth)
                            .shadow(color: .black.opacity(0.55), radius: lineWidth * 0.18, x: 0, y: lineWidth * 0.12)
                            .position(
                                x: geo.size.width / 2 + r * CGFloat(cos(angle.radians)),
                                y: geo.size.height / 2 + r * CGFloat(sin(angle.radians))
                            )
                    }
                }
            }
            .rotationEffect(.degrees(-90))

            // Start glyph at 12 o'clock
            GeometryReader { geo in
                let r = min(geo.size.width, geo.size.height) / 2
                Image(systemName: kind.symbol)
                    .font(.system(size: lineWidth * 0.58, weight: .heavy))
                    .foregroundColor(.black.opacity(0.85))
                    .position(x: geo.size.width / 2, y: geo.size.height / 2 - r)
            }
        }
    }
}

// MARK: - Concentric triple rings

struct FitnessTripleRings: View {
    let focus: Double
    let checks: Double
    let goal: Double
    var lineRatio: CGFloat = 0.118

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let line = size * lineRatio
            let gap = line * 0.14
            ZStack {
                FitnessRing(kind: .focus, progress: focus, lineWidth: line)
                    .padding(line / 2)
                FitnessRing(kind: .checks, progress: checks, lineWidth: line)
                    .padding(line / 2 + (line + gap))
                FitnessRing(kind: .goal, progress: goal, lineWidth: line)
                    .padding(line / 2 + 2 * (line + gap))
            }
            .frame(width: size, height: size)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }
}

// MARK: - Root: rings page first, then goal pages (Digital Crown / vertical swipe).
// The original List UI and the Badge Wall open from the rings page's bottom corners.

public struct WatchFitnessRootView: View {
    @State private var page: Int = 0

    public init() {}

    public var body: some View {
        TabView(selection: $page) {
            WatchFitnessRingsView()
                .tag(0)
            // Crown down: change goals (Focus minutes → Complete count → Goal %)
            WatchRingGoalPage(kind: .focus)
                .tag(1)
            WatchRingGoalPage(kind: .complete)
                .tag(2)
            WatchRingGoalPage(kind: .goal)
                .tag(3)
        }
        .tabViewStyle(.verticalPage)
    }
}

// MARK: - Rings page (Apple Fitness replica)

public struct WatchFitnessRingsView: View {
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @ObservedObject private var workout = FocusWorkoutModel.shared
    @State private var animatedScale: Double = 0
    @State private var dragOffset: CGFloat = 0
    @State private var showWorkout = false
    @State private var showList = false
    @State private var showBadges = false
    // Rings alone by default; tap the rings to reveal the numbers
    @State private var showStats = false

    public init() {}

    private var rings: ActivityRingsState { syncManager.ringsState }

    public var body: some View {
        NavigationStack {
            ringsContent
                .navigationTitle("活动")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    // Apple Watch style corner buttons: List (left) · Badge Wall (right)
                    ToolbarItemGroup(placement: .bottomBar) {
                        Button {
                            showList = true
                        } label: {
                            Image(systemName: "list.bullet")
                        }
                        .accessibilityLabel("List")
                        Spacer()
                        Button {
                            showBadges = true
                        } label: {
                            Image(systemName: "medal.fill")
                        }
                        .accessibilityLabel("Badge Wall")
                    }
                }
        }
        // Original Watch List UI, untouched (boards → lists → checklist)
        .fullScreenCover(isPresented: $showList) {
            WatchChecklistView()
        }
        .fullScreenCover(isPresented: $showBadges) {
            NavigationStack {
                WatchBadgesView()
                    .navigationTitle("勋章墙")
            }
        }
        .fullScreenCover(isPresented: $showWorkout) {
            WatchFocusWorkoutView(workout: workout, onClose: {
                showWorkout = false
            })
        }
        .onAppear {
            FocusWorkoutModel.shared.requestPhoneTimer()
            if workout.phase == .running || workout.phase == .paused { showWorkout = true }
        }
        .onChange(of: workout.phase) { phase in
            if (phase == .running || phase == .paused) && !showWorkout { showWorkout = true }
            if phase == .idle && workout.closedRemotely { showWorkout = false }
        }
    }

    private var ringsContent: some View {
        VStack(spacing: 2) {
            FitnessTripleRings(
                focus: rings.focusProgress * animatedScale,
                checks: rings.checkProgress * animatedScale,
                goal: rings.goalProgress * animatedScale
            )
            .frame(height: showStats ? 82 : 128)
            .offset(x: dragOffset)
            .contentShape(Rectangle())
            .onTapGesture {
                WKInterfaceDevice.current().play(.click)
                withAnimation(.spring(response: 0.42, dampingFraction: 0.82)) { showStats.toggle() }
            }
            .overlay(alignment: .leading) {
                // Swipe-right affordance
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(hex: "#FA114F").opacity(0.35 + Double(min(dragOffset, 60) / 60) * 0.65))
                    .offset(x: -2)
            }
            .gesture(
                DragGesture(minimumDistance: 12)
                    .onChanged { value in
                        guard value.translation.width > 0, abs(value.translation.width) > abs(value.translation.height) else { return }
                        dragOffset = min(value.translation.width * 0.45, 46)
                    }
                    .onEnded { value in
                        let trigger = value.translation.width > 46 && abs(value.translation.width) > abs(value.translation.height)
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) { dragOffset = 0 }
                        if trigger {
                            WKInterfaceDevice.current().play(.click)
                            // First run asks for HealthKit (screen-on workout session + heart rate)
                            FocusHealthSession.shared.prepare {
                                workout.beginCountdown()
                                showWorkout = true
                            }
                        }
                    }
            )

            if showStats {
                VStack(spacing: 0) {
                    ringStatRow(.focus, value: "\(rings.focusMinutes)/\(rings.targetMinutes)", unit: "MIN")
                    ringStatRow(.checks, value: "\(rings.checkCount)/\(rings.targetChecks)", unit: "次")
                    ringStatRow(.goal, value: "\(rings.goalPercent)/\(rings.goalTarget)", unit: "%")
                }
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            }

        }
        .padding(.horizontal, 2)
        // Sit high so the stats clear the corner buttons
        .frame(maxHeight: .infinity, alignment: .top)
        .padding(.top, -6)
        .onAppear {
            animatedScale = 0
            withAnimation(.spring(response: 1.2, dampingFraction: 0.86).delay(0.1)) {
                animatedScale = 1
            }
        }
    }

    private func ringStatRow(_ kind: FitnessRingKind, value: String, unit: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(kind.title)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
                .frame(width: 28, alignment: .leading)
            Text(value)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(kind.colors[1])
            Text(unit)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(kind.colors[1])
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 6)
    }
}

// MARK: - Workout state machine

final class FocusWorkoutModel: ObservableObject {
    enum Phase { case idle, countdown, running, paused, ended }

    /// One timer per app, shared with the iPhone Dynamic Island timer.
    static let shared = FocusWorkoutModel()
    private(set) var sessionId: String = UUID().uuidString
    /// True when the iPhone ended the session (the watch closes without its own summary).
    @Published private(set) var closedRemotely = false

    @Published var phase: Phase = .idle
    @Published var countdownValue: Int = 3
    @Published var countdownProgress: Double = 0
    @Published var committedMinutes: Int = 0

    private var accumulated: TimeInterval = 0
    private var runStart: Date?
    private var countdownTimer: Timer?
    private(set) var startedAt: Date?

    func elapsed(at date: Date = Date()) -> TimeInterval {
        if let runStart = runStart { return accumulated + date.timeIntervalSince(runStart) }
        return accumulated
    }

    func beginCountdown() {
        reset()
        phase = .countdown
        countdownValue = 3
        countdownProgress = 0
        withAnimation(.linear(duration: 3)) { countdownProgress = 1 }
        countdownTimer?.invalidate()
        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self = self else { timer.invalidate(); return }
            if self.countdownValue > 1 {
                self.countdownValue -= 1
                WKInterfaceDevice.current().play(.click)
            } else {
                timer.invalidate()
                self.start()
            }
        }
    }

    func start() {
        WatchSyncManager.shared.isFocusWorkoutActive = true
        sessionId = UUID().uuidString
        closedRemotely = false
        startedAt = Date()
        runStart = Date()
        phase = .running
        FocusHealthSession.shared.start()
        WKInterfaceDevice.current().play(.start)
        sendToPhone()
    }

    func pause() {
        guard phase == .running, let runStart = runStart else { return }
        accumulated += Date().timeIntervalSince(runStart)
        self.runStart = nil
        phase = .paused
        FocusHealthSession.shared.pause()
        WKInterfaceDevice.current().play(.stop)
        sendToPhone()
    }

    func resume() {
        guard phase == .paused else { return }
        runStart = Date()
        phase = .running
        FocusHealthSession.shared.resume()
        WKInterfaceDevice.current().play(.start)
        sendToPhone()
    }

    func end() {
        if let runStart = runStart { accumulated += Date().timeIntervalSince(runStart) }
        runStart = nil
        countdownTimer?.invalidate()
        WatchSyncManager.shared.isFocusWorkoutActive = false
        let minutes = Int(accumulated / 60)
        committedMinutes = minutes
        if minutes > 0 { WatchSyncManager.shared.commitFocusWorkout(minutes: minutes) }
        // Keep sub-minute sessions out of Health
        FocusHealthSession.shared.end(save: minutes > 0)
        phase = .ended
        WKInterfaceDevice.current().play(.success)
        // The watch committed the minutes; the island timer just clears
        sendToPhone(ended: true)
    }

    // MARK: Shared timer sync (same model as the island: runningSince + accumulated)

    private func sendToPhone(ended: Bool = false) {
        var payload: [String: Any] = ["sessionId": sessionId, "updatedAt": Date().timeIntervalSince1970]
        if ended {
            payload["state"] = "ended"
        } else {
            payload["state"] = phase == .paused ? "paused" : "running"
            payload["runningSince"] = runStart?.timeIntervalSince1970 ?? 0
            payload["accumulated"] = accumulated
        }
        Self.deliver(["action": "focusTimer", "focusTimer": payload])
    }

    func requestPhoneTimer() {
        Self.deliver(["action": "requestFocusTimer"], queueIfUnreachable: false)
    }

    private static func deliver(_ message: [String: Any], queueIfUnreachable: Bool = true) {
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { _ in
                if queueIfUnreachable { WCSession.default.transferUserInfo(message) }
            }
        } else if queueIfUnreachable {
            WCSession.default.transferUserInfo(message)
        }
    }

    /// Follow a timer change made on the iPhone (Dynamic Island). Never echoes back.
    func applyRemote(_ payload: [String: Any]) {
        let state = payload["state"] as? String ?? "ended"
        if state == "ended" {
            guard phase == .running || phase == .paused || phase == .countdown else { return }
            if let remoteId = payload["sessionId"] as? String, !remoteId.isEmpty, remoteId != sessionId, phase != .countdown {
                // An unrelated session ended elsewhere; keep ours
                return
            }
            countdownTimer?.invalidate()
            FocusHealthSession.shared.end(save: false)
            WatchSyncManager.shared.isFocusWorkoutActive = false
            accumulated = 0
            runStart = nil
            closedRemotely = true
            phase = .idle
            WKInterfaceDevice.current().play(.stop)
            return
        }
        guard state == "running" || state == "paused" else { return }
        countdownTimer?.invalidate()
        let wasLive = phase == .running || phase == .paused
        sessionId = payload["sessionId"] as? String ?? sessionId
        accumulated = payload["accumulated"] as? Double ?? 0
        let since = payload["runningSince"] as? Double ?? 0
        runStart = (state == "running" && since > 0) ? Date(timeIntervalSince1970: since) : nil
        if startedAt == nil || !wasLive { startedAt = Date().addingTimeInterval(-elapsed()) }
        closedRemotely = false
        WatchSyncManager.shared.isFocusWorkoutActive = true
        let newPhase: Phase = state == "running" ? .running : .paused
        if newPhase != phase {
            if !wasLive { FocusHealthSession.shared.start() }
            if newPhase == .paused { FocusHealthSession.shared.pause() } else if wasLive { FocusHealthSession.shared.resume() }
            phase = newPhase
            WKInterfaceDevice.current().play(.click)
        }
    }

    func cancelCountdown() {
        WatchSyncManager.shared.isFocusWorkoutActive = false
        countdownTimer?.invalidate()
        reset()
    }

    private func reset() {
        accumulated = 0
        runStart = nil
        startedAt = nil
        committedMinutes = 0
        phase = .idle
    }
}

extension WatchSyncManager {
    /// Commit a finished focus workout to Ring 1 and mirror the rings to the phone.
    func commitFocusWorkout(minutes: Int) {
        addFocusMinutes(minutes)
        let message: [String: Any] = [
            "action": "updateActivityRings",
            "focusMinutes": ringsState.focusMinutes,
            "checkCount": ringsState.checkCount,
            "goalPercent": ringsState.goalPercent,
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

// MARK: - Workout flow container

struct WatchFocusWorkoutView: View {
    @ObservedObject var workout: FocusWorkoutModel
    var onClose: () -> Void
    @State private var page: Int = 1

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            switch workout.phase {
            case .idle, .countdown:
                WorkoutCountdownView(workout: workout, onCancel: {
                    workout.cancelCountdown()
                    onClose()
                })
            case .running, .paused:
                TabView(selection: $page) {
                    WorkoutControlsView(workout: workout)
                    .tag(0)
                    WorkoutMetricsView(workout: workout)
                        .tag(1)
                }
                .tabViewStyle(.page(indexDisplayMode: .automatic))
            case .ended:
                WorkoutSummaryView(workout: workout, onDone: onClose)
            }
        }
        .onDisappear {
            // System close (✕) mid-session still ends the workout and commits the minutes
            switch workout.phase {
            case .running, .paused: workout.end()
            case .countdown: workout.cancelCountdown()
            default: break
            }
        }
    }
}

// MARK: - 3·2·1 countdown (Workout app style)

struct WorkoutCountdownView: View {
    @ObservedObject var workout: FocusWorkoutModel
    var onCancel: () -> Void

    var body: some View {
        VStack(spacing: 8) {
            Text("准备")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundColor(.secondary)
            ZStack {
                Circle()
                    .stroke(FitnessRingKind.focus.colors[1].opacity(0.22), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: CGFloat(workout.countdownProgress))
                    .stroke(
                        AngularGradient(gradient: Gradient(colors: FitnessRingKind.focus.colors), center: .center),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                Text("\(workout.countdownValue)")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
                    .contentTransition(.numericText())
                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: workout.countdownValue)
            }
            .frame(width: 112, height: 112)
            Button("取消", action: onCancel)
                .font(.system(size: 13, weight: .semibold))
                .buttonStyle(.plain)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Live metrics page (yellow elapsed time, rings, focus delta)

struct WorkoutMetricsView: View {
    @ObservedObject var workout: FocusWorkoutModel
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @ObservedObject private var health = FocusHealthSession.shared

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.05)) { context in
            let elapsed = workout.elapsed(at: context.date)
            let liveFocus = Double(syncManager.ringsState.focusMinutes) + elapsed / 60
            let target = Double(max(syncManager.ringsState.targetMinutes, 1))
            let showHundredths = context.cadence == .live

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(FitnessRingKind.focus.colors[1])
                    Text(workout.phase == .paused ? "已暂停" : "专注计时")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(workout.phase == .paused ? Color(hex: "#FFD60A") : .secondary)
                    Spacer()
                    FitnessTripleRings(
                        focus: liveFocus / target,
                        checks: syncManager.ringsState.checkProgress,
                        goal: syncManager.ringsState.goalProgress,
                        lineRatio: 0.15
                    )
                    .frame(width: 26, height: 26)
                }

                Text(Self.format(elapsed, hundredths: showHundredths))
                    .font(.system(size: 38, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(Color(hex: "#FFD60A"))
                    .opacity(workout.phase == .paused ? (context.date.timeIntervalSince1970.truncatingRemainder(dividingBy: 1.0) < 0.5 ? 1 : 0.35) : 1)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)

                metricLine(value: "+\(Int(elapsed / 60))", unit: "专注 MIN", color: FitnessRingKind.focus.colors[1])
                metricLine(value: "\(Int(liveFocus))/\(Int(target))", unit: "红环 MIN", color: FitnessRingKind.focus.colors[2])
                metricLine(value: "\(syncManager.ringsState.checkCount)", unit: "打勾", color: FitnessRingKind.checks.colors[1])
                heartLine(bpm: health.heartRate, date: context.date)
            }
            .padding(.horizontal, 4)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func heartLine(bpm: Double, date: Date) -> some View {
        // Beat roughly in time with the measured rate (Workout app style)
        let period = bpm > 0 ? 60.0 / bpm : 1.0
        let phase = date.timeIntervalSince1970.truncatingRemainder(dividingBy: period) / period
        let beat = workout.phase == .running && bpm > 0 && phase < 0.18
        return HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(bpm > 0 ? "\(Int(bpm.rounded()))" : "--")
                .font(.system(size: 22, weight: .medium, design: .rounded))
                .monospacedDigit()
                .foregroundColor(.white)
            Text("BPM")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(Color(hex: "#FF375F"))
            Image(systemName: "heart.fill")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color(hex: "#FF375F"))
                .scaleEffect(beat ? 1.25 : 1.0)
        }
    }

    private func metricLine(value: String, unit: String, color: Color) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(value)
                .font(.system(size: 22, weight: .medium, design: .rounded))
                .monospacedDigit()
                .foregroundColor(.white)
            Text(unit)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(color)
        }
    }

    static func format(_ t: TimeInterval, hundredths: Bool) -> String {
        let total = max(t, 0)
        let h = Int(total) / 3600
        let m = (Int(total) % 3600) / 60
        let s = Int(total) % 60
        let cs = Int((total - floor(total)) * 100)
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        return hundredths ? String(format: "%02d:%02d.%02d", m, s, cs) : String(format: "%02d:%02d", m, s)
    }
}

// MARK: - Controls page (swipe right from metrics): End + Pause/Resume

struct WorkoutControlsView: View {
    @ObservedObject var workout: FocusWorkoutModel

    var body: some View {
        VStack(spacing: 8) {
            // Current state stays visible while paused (Pause never leaves this screen)
            TimelineView(.periodic(from: .now, by: 1)) { context in
                HStack(spacing: 6) {
                    Text(workout.phase == .paused ? "已暂停" : "专注中")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(workout.phase == .paused ? Color(hex: "#FFD60A") : .secondary)
                    Text(WorkoutMetricsView.format(workout.elapsed(at: context.date), hundredths: false))
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(Color(hex: "#FFD60A"))
                }
            }
            controlsRow
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var controlsRow: some View {
        HStack(spacing: 14) {
            controlButton(
                symbol: "xmark",
                title: "结束",
                tint: Color(hex: "#FF453A"),
                action: { workout.end() }
            )
            controlButton(
                symbol: workout.phase == .paused ? "arrow.clockwise" : "pause.fill",
                title: workout.phase == .paused ? "继续" : "暂停",
                tint: Color(hex: "#FFD60A"),
                action: {
                    if workout.phase == .paused { workout.resume() } else { workout.pause() }
                }
            )
        }
    }

    private func controlButton(symbol: String, title: String, tint: Color, action: @escaping () -> Void) -> some View {
        VStack(spacing: 6) {
            Button(action: action) {
                Image(systemName: symbol)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(tint)
                    .frame(width: 66, height: 66)
                    .background(Circle().fill(tint.opacity(0.22)))
            }
            .buttonStyle(.plain)
            Text(title)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Summary (Workout app style)

struct WorkoutSummaryView: View {
    @ObservedObject var workout: FocusWorkoutModel
    @ObservedObject private var syncManager = WatchSyncManager.shared
    var onDone: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("专注总结")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                if let start = workout.startedAt {
                    Text(start, style: .time)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundColor(.secondary)
                }

                summaryRow(title: "总时间", value: WorkoutMetricsView.format(workout.elapsed(), hundredths: false), color: Color(hex: "#FFD60A"))
                summaryRow(title: "计入红环", value: "+\(workout.committedMinutes) MIN", color: FitnessRingKind.focus.colors[1])

                HStack(spacing: 10) {
                    FitnessTripleRings(
                        focus: syncManager.ringsState.focusProgress,
                        checks: syncManager.ringsState.checkProgress,
                        goal: syncManager.ringsState.goalProgress
                    )
                    .frame(width: 52, height: 52)
                    Text(syncManager.ringsState.isAllClosed ? "三环已全部闭合" : "已闭合 \(syncManager.ringsState.closedRingsCount) / 3")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                }
                .padding(.vertical, 4)

                if workout.committedMinutes == 0 {
                    Text("不足 1 分钟，未计入红环")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }

                Button(action: onDone) {
                    Text("完成")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .frame(maxWidth: .infinity)
                }
                .tint(FitnessRingKind.focus.colors[1])
            }
            .padding(.horizontal, 4)
        }
    }

    private func summaryRow(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundColor(.white)
            Text(value)
                .font(.system(size: 24, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(color)
        }
    }
}
