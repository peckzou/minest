import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

/// Minest Live Activity Widget implementing Dynamic Island (Compact, Minimal, Expanded) and Lock Screen Banner
public struct MinestLiveActivityWidget: Widget {
    public init() {}
    
    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyActivityAttributes.self) { context in
            // =================================================================
            // Lock Screen / Notification Center Banner
            // =================================================================
            StudyLockScreenBannerView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            // =================================================================
            // Dynamic Island (iOS 16.1+ iPhone 14 Pro, 15, 16, 17, etc.)
            // =================================================================
            DynamicIsland {
                // Expanded (pull-down): rings + detail · full list name · focus timer
                DynamicIslandExpandedRegion(.leading) {
                    LiveThreeRings(rings: context.state.rings, lineWidth: 4.4, strikeFontSize: 15)
                        .frame(width: 50, height: 50)
                        .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    IslandRingsDetail(rings: context.state.rings)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .padding(.trailing, 6)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        // Full list name lives here (the compact island only shows ≤5 letters)
                        Text(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        IslandFocusTimerRow(timer: context.state.timer)
                    }
                    .padding(.horizontal, 8)
                    .padding(.bottom, 2)
                }
            } compactLeading: {
                // While a focus timer is running/paused the time replaces the short title
                if let timer = context.state.timer, timer.stoppedSeconds == nil {
                    Group {
                        if let since = timer.runningSince {
                            Text(since.addingTimeInterval(-timer.accumulated), style: .timer)
                        } else {
                            Text(IslandFocusTimerRow.format(timer.accumulated))
                        }
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(Color(red: 1.0, green: 214/255, blue: 10/255).opacity(timer.isRunning ? 1 : 0.6))
                    .lineLimit(1)
                    .multilineTextAlignment(.leading)
                    .frame(width: 48, alignment: .leading)
                    .padding(.leading, 4)
                } else {
                    // Short title only (≤5 letters, never shrunk to fit); empty when there is no title
                    Text(LiveIslandTitle.short(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle))
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.95))
                        .lineLimit(1)
                        .fixedSize()
                        .padding(.leading, 4)
                }
            } compactTrailing: {
                // Live Three Rings with Strike days in the centre
                LiveThreeRings(rings: context.state.rings, lineWidth: 2.1, strikeFontSize: 8.5)
                    .frame(width: 24, height: 24)
                    .padding(.trailing, 2)
            } minimal: {
                LiveThreeRings(rings: context.state.rings, lineWidth: 1.8, strikeFontSize: 7)
                    .frame(width: 21, height: 21)
            }
        }
    }
}

// =============================================================================
// Lock Screen Banner View
// =============================================================================
private struct StudyLockScreenBannerView: View {
    let context: ActivityViewContext<StudyActivityAttributes>

    // Same structure as the expanded island: rings + full name + ring detail, then the timer
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                LiveThreeRings(rings: context.state.rings, lineWidth: 4.6, strikeFontSize: 15)
                    .frame(width: 52, height: 52)

                VStack(alignment: .leading, spacing: 4) {
                    Text(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    LockRingsLine(rings: context.state.rings)
                }
                Spacer(minLength: 0)
            }

            IslandFocusTimerRow(timer: context.state.timer, compact: true)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

/// One-line ring detail for the lock screen: 专注 8/15 · 完成 1/10 · 目标 7/100%
private struct LockRingsLine: View {
    let rings: StudyActivityAttributes.RingsSnapshot?

    var body: some View {
        HStack(spacing: 10) {
            item("专注", "\(rings?.focusMinutes ?? 0)/\(rings?.targetMinutes ?? 30)", Color(red: 1.0, green: 83/255, blue: 126/255))
            item("完成", "\(rings?.checkCount ?? 0)/\(rings?.targetChecks ?? 10)", Color(red: 185/255, green: 232/255, blue: 83/255))
            item("目标", "\(rings?.goalPercent ?? 0)/\(rings?.targetGoalPercent ?? 100)%", Color(red: 93/255, green: 220/255, blue: 229/255))
        }
        .lineLimit(1)
    }

    private func item(_ label: String, _ value: String, _ color: Color) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.55))
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(color)
        }
        .fixedSize()
    }
}

// =============================================================================
// Live Three Rings (Minest palette, same as the web rings) + Strike centre
// =============================================================================
struct LiveThreeRings: View {
    let rings: StudyActivityAttributes.RingsSnapshot?
    let lineWidth: CGFloat
    let strikeFontSize: CGFloat

    private static let palette: [Color] = [
        Color(red: 1.0, green: 83/255, blue: 126/255),     // Focus
        Color(red: 185/255, green: 232/255, blue: 83/255), // Complete
        Color(red: 93/255, green: 220/255, blue: 229/255)  // Goal
    ]

    var body: some View {
        let values = [rings?.focus ?? 0, rings?.complete ?? 0, rings?.goal ?? 0]
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let gap = lineWidth * 0.28
            ZStack {
                ForEach(0..<3, id: \.self) { i in
                    let inset = lineWidth / 2 + CGFloat(i) * (lineWidth + gap)
                    let p = max(values[i], 0)
                    ZStack {
                        Circle()
                            .stroke(Self.palette[i].opacity(0.24), lineWidth: lineWidth)
                        Circle()
                            .trim(from: 0, to: CGFloat(min(p, 1)))
                            .stroke(Self.palette[i], style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        if p > 1 {
                            // Second lap, slightly brighter
                            Circle()
                                .trim(from: 0, to: CGFloat(min(p - 1, 1)))
                                .stroke(Self.palette[i].opacity(0.75), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                                .rotationEffect(.degrees(-90))
                        }
                    }
                    .padding(inset)
                }
                // Strike days sit inside the innermost ring's hole
                Text("\(rings?.strikeDays ?? 0)")
                    .font(.system(size: strikeFontSize, weight: .heavy, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .frame(width: max(size - 2 * (3 * lineWidth + 2 * gap) - 1, 1))
            }
            .frame(width: size, height: size)
        }
    }
}

/// Dynamic Island title: initials or the first letters, at most 5 letters (2 for CJK).
enum LiveIslandTitle {
    static func short(_ title: String) -> String {
        let t = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return "" }
        if t.unicodeScalars.contains(where: { $0.value >= 0x2E80 }) {
            return String(t.filter { !$0.isWhitespace }.prefix(2))
        }
        let words = t.split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        if words.count >= 2 {
            return String(words.compactMap { $0.first }.prefix(5)).uppercased()
        }
        return String(t.prefix(5))
    }
}

// Color helpers
private extension Color {
    static let emerald400 = Color(red: 52/255, green: 211/255, blue: 153/255)
    static let teal300 = Color(red: 94/255, green: 234/255, blue: 212/255)
    static let cyan400 = Color(red: 34/255, green: 211/255, blue: 238/255)
}
