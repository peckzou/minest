import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Dynamic Island focus timer (Watch 4.0 style: start / pause / stop)
//
// The buttons only change the timer in the Live Activity state. On Stop the elapsed
// time is kept in `stoppedSeconds`; the Minest app commits it to the Focus ring
// (through the web app's own ring state) the next time it is running.

// MARK: - Timer row shared by the expanded island and the lock screen banner

struct IslandFocusTimerRow: View {
    let timer: StudyActivityAttributes.FocusTimerState?
    var compact: Bool = false

    private static let yellow = Color(red: 1.0, green: 214/255, blue: 10/255)
    private static let red = Color(red: 1.0, green: 69/255, blue: 58/255)
    private static let focus = Color(red: 1.0, green: 83/255, blue: 126/255)

    var body: some View {
        HStack(spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                timeText
                    .font(.system(size: compact ? 20 : 22, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(timer == nil ? .white.opacity(0.35) : Self.yellow)
                    .lineLimit(1)
                    .multilineTextAlignment(.leading)
                    .frame(width: compact ? 78 : 84, alignment: .leading)
                Text(statusText)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            Spacer(minLength: 4)
            if #available(iOS 17.0, *) {
                controls
            }
        }
    }

    @ViewBuilder private var timeText: some View {
        if let timer = timer, let since = timer.runningSince, timer.stoppedSeconds == nil {
            // Live, system-driven count-up from the (pause-adjusted) start; bounded width
            Text(since.addingTimeInterval(-timer.accumulated), style: .timer)
        } else {
            Text(Self.format(timer?.stoppedSeconds ?? timer?.accumulated ?? 0))
        }
    }

    private var statusText: String {
        guard let timer = timer else { return "专注计时" }
        if timer.stoppedSeconds != nil { return "打开 App 计入红环" }
        return timer.isRunning ? "专注中" : "已暂停"
    }

    @available(iOS 17.0, *)
    @ViewBuilder private var controls: some View {
        let stopped = timer?.stoppedSeconds != nil
        if timer == nil || stopped {
            Button(intent: IslandFocusTimerIntent(action: "start")) {
                circle("play.fill", tint: Self.focus)
            }
            .buttonStyle(.plain)
        } else {
            if timer?.isRunning == true {
                Button(intent: IslandFocusTimerIntent(action: "pause")) {
                    circle("pause.fill", tint: Self.yellow)
                }
                .buttonStyle(.plain)
            } else {
                Button(intent: IslandFocusTimerIntent(action: "start")) {
                    circle("play.fill", tint: Self.yellow)
                }
                .buttonStyle(.plain)
            }
            Button(intent: IslandFocusTimerIntent(action: "stop")) {
                circle("stop.fill", tint: Self.red)
            }
            .buttonStyle(.plain)
        }
    }

    private func circle(_ symbol: String, tint: Color) -> some View {
        Image(systemName: symbol)
            .font(.system(size: compact ? 13 : 15, weight: .bold))
            .foregroundColor(tint)
            .frame(width: compact ? 32 : 34, height: compact ? 32 : 34)
            .background(Circle().fill(tint.opacity(0.22)))
    }

    static func format(_ seconds: Double) -> String {
        let t = Int(max(seconds, 0))
        let h = t / 3600, m = (t % 3600) / 60, s = t % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
}

// MARK: - Three Rings detail rows (expanded island)

struct IslandRingsDetail: View {
    let rings: StudyActivityAttributes.RingsSnapshot?

    var body: some View {
        VStack(alignment: .trailing, spacing: 1) {
            row("专注", value: "\(rings?.focusMinutes ?? 0)/\(rings?.targetMinutes ?? 30)", unit: "MIN",
                color: Color(red: 1.0, green: 83/255, blue: 126/255))
            row("完成", value: "\(rings?.checkCount ?? 0)/\(rings?.targetChecks ?? 10)", unit: "",
                color: Color(red: 185/255, green: 232/255, blue: 83/255))
            row("目标", value: "\(rings?.goalPercent ?? 0)/\(rings?.targetGoalPercent ?? 100)", unit: "%",
                color: Color(red: 93/255, green: 220/255, blue: 229/255))
        }
    }

    private func row(_ label: String, value: String, unit: String, color: Color) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.55))
                .fixedSize()
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(color)
                .fixedSize()
            if !unit.isEmpty {
                Text(unit)
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundColor(color)
                    .fixedSize()
            }
        }
        .lineLimit(1)
    }
}
