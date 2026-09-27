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
                // Expanded View (Long press / Expand Dynamic Island)
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: context.state.isAllDone ? "checkmark.seal.fill" : "checklist")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(LinearGradient(colors: [Color.emerald400, Color.cyan400], startPoint: .top, endPoint: .bottom))
                        
                        VStack(alignment: .leading, spacing: 1) {
                            Text(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle)
                                .font(.system(size: 13, weight: .bold))
                                .lineLimit(1)
                                .foregroundColor(.white)
                            Text(context.state.isAllDone ? "全部达成 🎉" : "当前清单进度")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(context.state.isAllDone ? Color.emerald400 : Color.white.opacity(0.6))
                        }
                    }
                    .padding(.leading, 4)
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        HStack(spacing: 4) {
                            Text("\(context.state.completedCount)/\(context.state.totalCount)")
                                .font(.system(size: 14, weight: .heavy, design: .rounded))
                                .foregroundColor(Color.emerald400)
                            
                            ZStack {
                                Circle()
                                    .stroke(Color.white.opacity(0.2), lineWidth: 2)
                                Circle()
                                    .trim(from: 0, to: CGFloat(context.state.progress))
                                    .stroke(Color.emerald400, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                                    .rotationEffect(.degrees(-90))
                            }
                            .frame(width: 14, height: 14)
                        }
                        
                        Text("\(Int(context.state.progress * 100))% 完成")
                            .font(.system(size: 9))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    .padding(.trailing, 4)
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        // Interactive Checklist Items in Dynamic Island
                        if context.state.mode == "checklist" && !context.state.items.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                ForEach(context.state.items.prefix(2)) { item in
                                    Button(intent: ToggleChecklistItemIntent(itemId: item.id)) {
                                        HStack(spacing: 6) {
                                            Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
                                                .font(.system(size: 13, weight: .bold))
                                                .foregroundColor(item.isDone ? Color.emerald400 : Color.white.opacity(0.45))
                                            Text(item.text)
                                                .font(.system(size: 11, weight: item.isDone ? .regular : .semibold))
                                                .strikethrough(item.isDone, color: Color.white.opacity(0.4))
                                                .foregroundColor(item.isDone ? Color.white.opacity(0.4) : Color.white.opacity(0.92))
                                                .lineLimit(1)
                                            Spacer()
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, 1)
                        } else if !context.state.itemText.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(Color.emerald400)
                                Text(context.state.itemText)
                                    .font(.system(size: 11, weight: .medium))
                                    .lineLimit(1)
                                    .foregroundColor(.white.opacity(0.88))
                            }
                        }
                        
                        // Progress bar & fraction
                        VStack(spacing: 4) {
                            HStack {
                                Text(context.state.mode == "checklist" ? "\(context.state.completedCount) / \(context.state.totalCount) 项" : "\(context.state.completedCards) / \(context.state.totalCards) 张卡")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                Spacer()
                                Text("\(Int(context.state.progress * 100))%")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(Color.emerald400)
                            }
                            
                            // Liquid Glass Progress Bar
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule()
                                        .fill(Color.white.opacity(0.12))
                                        .frame(height: 6)
                                    
                                    Capsule()
                                        .fill(LinearGradient(
                                            colors: [Color.emerald400, Color.teal300],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        ))
                                        .frame(width: max(geo.size.width * CGFloat(context.state.progress), 6), height: 6)
                                        .shadow(color: Color.emerald400.opacity(0.5), radius: 4, x: 0, y: 0)
                                }
                            }
                            .frame(height: 6)
                            
                            // Interactive action buttons for iOS 17+
                            if #available(iOS 17.0, *) {
                                HStack(spacing: 8) {
                                    if context.state.mode == "flashcard" {
                                        Button(intent: CompleteCardIntent()) {
                                            HStack(spacing: 4) {
                                                Image(systemName: "star.fill")
                                                    .font(.system(size: 10, weight: .bold))
                                                Text("掌握了 (+1星)")
                                                    .font(.system(size: 11, weight: .bold))
                                            }
                                            .foregroundColor(.black)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 5)
                                            .background(Capsule().fill(Color.emerald400))
                                        }
                                        .buttonStyle(.plain)
                                        
                                        Button(intent: DrawRandomCardIntent()) {
                                            HStack(spacing: 3) {
                                                Image(systemName: "shuffle")
                                                    .font(.system(size: 10, weight: .bold))
                                                Text("换一张")
                                                    .font(.system(size: 11, weight: .medium))
                                            }
                                            .foregroundColor(.white.opacity(0.9))
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 5)
                                            .background(Capsule().fill(Color.white.opacity(0.15)))
                                        }
                                        .buttonStyle(.plain)
                                    } else {
                                        Button(intent: CompleteCardIntent()) {
                                            HStack(spacing: 4) {
                                                Image(systemName: context.state.isAllDone ? "checkmark.seal.fill" : "checkmark.circle.fill")
                                                    .font(.system(size: 11, weight: .bold))
                                                Text(context.state.isAllDone ? "全部达成 🎉" : "打勾完成")
                                                    .font(.system(size: 11, weight: .bold))
                                            }
                                            .foregroundColor(.black)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 5)
                                            .background(Capsule().fill(Color.emerald400))
                                        }
                                        .buttonStyle(.plain)
                                        .disabled(context.state.isAllDone)
                                    }
                                    
                                    Spacer()
                                    
                                    Button(intent: EndFocusIntent()) {
                                        HStack(spacing: 3) {
                                            Image(systemName: "xmark")
                                                .font(.system(size: 9, weight: .bold))
                                            Text("结束")
                                                .font(.system(size: 10, weight: .medium))
                                        }
                                        .foregroundColor(.white.opacity(0.7))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(Capsule().fill(Color.white.opacity(0.12)))
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(.top, 2)
                            }
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.top, 4)
                    .padding(.bottom, 6)
                }
                
            } compactLeading: {
                // =============================================================
                // Compact Leading: List Name inside Capsule
                // =============================================================
                HStack(spacing: 3) {
                    Image(systemName: context.state.isAllDone ? "checkmark.circle.fill" : "checklist")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color.emerald400)
                    Text(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle)
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .foregroundColor(.white)
                }
                .padding(.leading, 5)
                
            } compactTrailing: {
                // =============================================================
                // Compact Trailing: Ratio + Outer Circular Progress Ring
                // =============================================================
                HStack(spacing: 4) {
                    Text("\(context.state.completedCount)/\(context.state.totalCount)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundColor(context.state.isAllDone ? Color.emerald400 : Color.white.opacity(0.92))
                    
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.2), lineWidth: 2.2)
                        Circle()
                            .trim(from: 0, to: CGFloat(context.state.progress))
                            .stroke(
                                context.state.isAllDone
                                    ? LinearGradient(colors: [Color.emerald400, Color.cyan400], startPoint: .topLeading, endPoint: .bottomTrailing)
                                    : LinearGradient(colors: [Color.emerald400, Color.teal300], startPoint: .topLeading, endPoint: .bottomTrailing),
                                style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                        
                        if context.state.isAllDone {
                            Image(systemName: "checkmark")
                                .font(.system(size: 7, weight: .black))
                                .foregroundColor(Color.emerald400)
                        } else {
                            Circle()
                                .fill(Color.emerald400.opacity(0.35))
                                .frame(width: 3.5, height: 3.5)
                        }
                    }
                    .frame(width: 16, height: 16)
                }
                .padding(.trailing, 5)
                
            } minimal: {
                // =============================================================
                // Minimal: Circular Progress Ring
                // =============================================================
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.2), lineWidth: 2.2)
                    Circle()
                        .trim(from: 0, to: CGFloat(context.state.progress))
                        .stroke(
                            context.state.isAllDone
                                ? LinearGradient(colors: [Color.emerald400, Color.cyan400], startPoint: .topLeading, endPoint: .bottomTrailing)
                                : LinearGradient(colors: [Color.emerald400, Color.teal300], startPoint: .topLeading, endPoint: .bottomTrailing),
                            style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    
                    if context.state.isAllDone {
                        Image(systemName: "checkmark")
                            .font(.system(size: 8, weight: .black))
                            .foregroundColor(Color.emerald400)
                    } else {
                        Text("\(context.state.completedCount)")
                            .font(.system(size: 8.5, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                    }
                }
                .frame(width: 17, height: 17)
            }
        }
    }
}

// =============================================================================
// Lock Screen Banner View
// =============================================================================
private struct StudyLockScreenBannerView: View {
    let context: ActivityViewContext<StudyActivityAttributes>
    
    var body: some View {
        VStack(spacing: 10) {
            HStack(alignment: .center) {
                HStack(spacing: 8) {
                    Image(systemName: context.state.mode == "checklist" ? "checklist" : "rectangle.portrait.on.rectangle.portrait.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(LinearGradient(colors: [Color.emerald400, Color.cyan400], startPoint: .top, endPoint: .bottom))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.cardTitle.isEmpty ? context.attributes.boardTitle : context.state.cardTitle)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                        Text(context.state.itemText.isEmpty ? (context.state.mode == "checklist" ? "Checklist Task" : "Active Recall Drill") : context.state.itemText)
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.7))
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(context.state.completedCount) / \(context.state.totalCount) 完成")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color.emerald400)
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            
            // Interactive checklist items on Lock Screen
            if context.state.mode == "checklist" && !context.state.items.isEmpty {
                VStack(alignment: .leading, spacing: 5) {
                    ForEach(context.state.items.prefix(3)) { item in
                        Button(intent: ToggleChecklistItemIntent(itemId: item.id)) {
                            HStack(spacing: 7) {
                                Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(item.isDone ? Color.emerald400 : Color.white.opacity(0.45))
                                Text(item.text)
                                    .font(.system(size: 12, weight: item.isDone ? .regular : .semibold))
                                    .strikethrough(item.isDone, color: Color.white.opacity(0.4))
                                    .foregroundColor(item.isDone ? Color.white.opacity(0.4) : Color.white.opacity(0.92))
                                    .lineLimit(1)
                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 2)
            }
            
            // Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.15))
                        .frame(height: 7)
                    
                    Capsule()
                        .fill(LinearGradient(
                            colors: [Color.emerald400, Color.teal300],
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(width: max(geo.size.width * CGFloat(context.state.progress), 7), height: 7)
                        .shadow(color: Color.emerald400.opacity(0.4), radius: 5, x: 0, y: 0)
                }
            }
            .frame(height: 7)
            
            // Interactive action buttons for Lock Screen
            if #available(iOS 17.0, *) {
                HStack(spacing: 8) {
                    if context.state.mode == "flashcard" {
                        Button(intent: CompleteCardIntent()) {
                            HStack(spacing: 6) {
                                Image(systemName: "star.fill")
                                    .font(.system(size: 13, weight: .bold))
                                Text("掌握了 (+1星)")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(LinearGradient(colors: [Color.emerald400, Color.teal300], startPoint: .leading, endPoint: .trailing))
                                    .shadow(color: Color.emerald400.opacity(0.4), radius: 4, x: 0, y: 1)
                            )
                        }
                        .buttonStyle(.plain)
                        
                        Button(intent: DrawRandomCardIntent()) {
                            HStack(spacing: 4) {
                                Image(systemName: "shuffle")
                                    .font(.system(size: 11, weight: .bold))
                                Text("换一张")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(Color.white.opacity(0.15)))
                        }
                        .buttonStyle(.plain)
                    } else {
                        Button(intent: CompleteCardIntent()) {
                            HStack(spacing: 6) {
                                Image(systemName: context.state.isAllDone ? "checkmark.seal.fill" : "checkmark.circle.fill")
                                    .font(.system(size: 13, weight: .bold))
                                Text(context.state.isAllDone ? "全部达成 🎉" : "打勾完成一项")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(LinearGradient(colors: [Color.emerald400, Color.teal300], startPoint: .leading, endPoint: .trailing))
                                    .shadow(color: Color.emerald400.opacity(0.4), radius: 4, x: 0, y: 1)
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(context.state.isAllDone)
                    }
                    
                    Button(intent: EndFocusIntent()) {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                            .frame(width: 32, height: 32)
                            .background(
                                Circle()
                                    .fill(Color.white.opacity(0.12))
                            )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 4)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(red: 16/255, green: 24/255, blue: 32/255).opacity(0.92))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
        )
    }
}

// Color helpers
private extension Color {
    static let emerald400 = Color(red: 52/255, green: 211/255, blue: 153/255)
    static let teal300 = Color(red: 94/255, green: 234/255, blue: 212/255)
    static let cyan400 = Color(red: 34/255, green: 211/255, blue: 238/255)
}
