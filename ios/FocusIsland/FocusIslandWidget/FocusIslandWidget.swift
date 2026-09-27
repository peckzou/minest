import ActivityKit
import SwiftUI
import WidgetKit

struct FocusIslandLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusActivityAttributes.self) { context in
            // Lock Screen Banner & StandBy
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("📚")
                        .font(.title3)
                    Text("Focusboard")
                        .font(.headline)
                        .foregroundColor(.primary)
                    Spacer()
                    Text("\(context.state.completed)/\(context.state.total)")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.green)
                }
                
                Text(context.state.title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                ProgressView(value: Double(context.state.completed), total: Double(max(context.state.total, 1)))
                    .tint(.green)
                
                HStack {
                    Spacer()
                    Text("\(context.state.completed) of \(context.state.total) cards")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.85))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Leading
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Text("📚")
                            .font(.title2)
                    }
                    .padding(.leading, 4)
                }
                
                // Expanded Trailing
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.completed)/\(context.state.total)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(.green)
                        .padding(.trailing, 4)
                }
                
                // Expanded Center
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Focusboard")
                            .font(.subheadline)
                            .fontWeight(.bold)
                        Text(context.state.title)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Expanded Bottom
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 5) {
                        ProgressView(value: Double(context.state.completed), total: Double(max(context.state.total, 1)))
                            .tint(.green)
                        
                        HStack {
                            Text("\(context.state.completed) of \(context.state.total) cards")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 4)
                    .padding(.bottom, 6)
                }
            } compactLeading: {
                Text("📚")
                    .font(.system(size: 14))
            } compactTrailing: {
                Text("\(context.state.completed)/\(context.state.total)")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.green)
            } minimal: {
                Text("📚")
                    .font(.system(size: 14))
            }
            .keylineTint(.green)
        }
    }
}
