import WidgetKit
import SwiftUI
import ActivityKit
import AppIntents

// MARK: - Timeline Provider
public struct MinestWidgetProvider: TimelineProvider {
    public typealias Entry = MinestWidgetEntry
    
    public struct MinestWidgetEntry: TimelineEntry {
        public let date: Date
        public let boardTitle: String
        public let currentCard: String
        public let items: [StudyActivityAttributes.ChecklistItemState]
        public let completedCount: Int
        public let totalCount: Int
        public let isFocusing: Bool
        
        public var progress: Double {
            guard totalCount > 0 else { return 0 }
            return min(max(Double(completedCount) / Double(totalCount), 0), 1.0)
        }
        
        public var isAllDone: Bool {
            return completedCount >= totalCount && totalCount > 0
        }
    }
    
    public func placeholder(in context: Context) -> MinestWidgetEntry {
        let sampleItems = [
            StudyActivityAttributes.ChecklistItemState(id: "1", text: "Proactive classroom procedures", isDone: true),
            StudyActivityAttributes.ChecklistItemState(id: "2", text: "Restorative justice practices", isDone: true),
            StudyActivityAttributes.ChecklistItemState(id: "3", text: "Phoneme segmentation drills", isDone: false),
            StudyActivityAttributes.ChecklistItemState(id: "4", text: "Grapheme-phoneme mapping cards", isDone: false)
        ]
        return MinestWidgetEntry(
            date: Date(),
            boardTitle: "Minest 看板",
            currentCard: "Child Development",
            items: sampleItems,
            completedCount: 2,
            totalCount: 4,
            isFocusing: false
        )
    }
    
    public func getSnapshot(in context: Context, completion: @escaping (MinestWidgetEntry) -> Void) {
        let items = MinestWidgetDataStore.shared.getItems()
        let titles = MinestWidgetDataStore.shared.getTitles()
        let done = items.filter { $0.isDone }.count
        completion(MinestWidgetEntry(
            date: Date(),
            boardTitle: titles.board,
            currentCard: titles.card,
            items: items,
            completedCount: done,
            totalCount: max(items.count, 1),
            isFocusing: false
        ))
    }
    
    public func getTimeline(in context: Context, completion: @escaping (Timeline<MinestWidgetEntry>) -> Void) {
        let titles = MinestWidgetDataStore.shared.getTitles()
        let items = MinestWidgetDataStore.shared.getItems()
        let doneCount = items.filter { $0.isDone }.count
        let totalCount = max(items.count, 1)
        let isFocusing = Activity<StudyActivityAttributes>.activities.first != nil
        
        let entry = MinestWidgetEntry(
            date: Date(),
            boardTitle: titles.board,
            currentCard: titles.card,
            items: items,
            completedCount: doneCount,
            totalCount: totalCount,
            isFocusing: isFocusing
        )
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Home & Lock Screen Widget Definition
public struct MinestStaticWidget: Widget {
    public static let kind: String = "MinestStaticWidget"
    
    public init() {}
    
    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: Self.kind, provider: MinestWidgetProvider()) { entry in
            MinestWidgetEntryView(entry: entry)
                .containerBackground(Color(red: 11/255, green: 17/255, blue: 23/255), for: .widget)
        }
        .configurationDisplayName("Minest 待办清单")
        .description("在桌面直接勾选、推进看板任务，支持小、中、大号桌面组件与锁屏组件。")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

// MARK: - Widget Views per Family
private struct MinestWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: MinestWidgetProvider.Entry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallChecklistWidgetView(entry: entry)
            
        case .systemMedium:
            MediumChecklistWidgetView(entry: entry)
            
        case .systemLarge:
            LargeChecklistWidgetView(entry: entry)
            
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Gauge(value: entry.progress) {
                    Image(systemName: "checkmark")
                        .widgetAccentable()
                } currentValueLabel: {
                    Text("\(entry.completedCount)")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .widgetAccentable()
                }
                .gaugeStyle(.accessoryCircular)
            }
            
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: entry.isFocusing ? "timer" : "checklist")
                        .font(.system(size: 11, weight: .bold))
                        .widgetAccentable()
                    Text(entry.boardTitle)
                        .font(.system(size: 11, weight: .bold))
                        .lineLimit(1)
                }
                
                // First incomplete item
                if let nextItem = entry.items.first(where: { !$0.isDone }) {
                    Text("• " + nextItem.text)
                        .font(.system(size: 11, weight: .medium))
                        .lineLimit(1)
                        .foregroundColor(.white.opacity(0.85))
                } else {
                    Text("🎉 清单全部达成！")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.85))
                }
                
                HStack {
                    ProgressView(value: entry.progress)
                        .widgetAccentable()
                    Text("\(entry.completedCount)/\(entry.totalCount)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .widgetAccentable()
                }
            }
            
        case .accessoryInline:
            Text("📚 \(entry.currentCard) (\(entry.completedCount)/\(entry.totalCount))")
                .widgetAccentable()
            
        default:
            SmallChecklistWidgetView(entry: entry)
        }
    }
}

// MARK: - 1. Small Widget (Apple Reminders Style: 3 Checkable Items)
private struct SmallChecklistWidgetView: View {
    let entry: MinestWidgetProvider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack(alignment: .center) {
                HStack(spacing: 4) {
                    Image(systemName: entry.isFocusing ? "flame.fill" : "checklist")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color.emerald400)
                        .widgetAccentable()
                    Text(entry.boardTitle)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                Spacer()
                Text("\(entry.completedCount)/\(entry.totalCount)")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundColor(Color.emerald400)
                    .widgetAccentable()
            }
            
            Divider().background(Color.white.opacity(0.12))
            
            // Interactive Checklist Items (up to 3)
            VStack(alignment: .leading, spacing: 5) {
                ForEach(entry.items.filter { !$0.isDone }.prefix(3)) { item in
                    ChecklistRowItem(item: item, fontSize: 11, iconSize: 14)
                }
                if entry.items.allSatisfy({ $0.isDone }) {
                    AllDoneRow(fontSize: 11)
                }
            }
            
            Spacer(minLength: 0)
            
            // Progress Bar
            ProgressView(value: entry.progress)
                .tint(Color.emerald400)
                .widgetAccentable()
        }
        .padding(10)
    }
}

// MARK: - 2. Medium Widget (Apple Reminders Style: 4-5 Checkable Items + Ring Gauge)
private struct MediumChecklistWidgetView: View {
    let entry: MinestWidgetProvider.Entry
    
    var body: some View {
        HStack(spacing: 14) {
            // Left Column: Interactive Reminders List
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "checklist")
                            .foregroundColor(Color.emerald400)
                            .font(.system(size: 12, weight: .bold))
                            .widgetAccentable()
                        Text(entry.boardTitle)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    Spacer()
                    if entry.isAllDone {
                        Text("全部达成 🎉")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color.emerald400)
                    }
                }
                
                Divider().background(Color.white.opacity(0.12))
                
                // Interactive Checklist Items (up to 4)
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.items.filter { !$0.isDone }.prefix(4)) { item in
                        ChecklistRowItem(item: item, fontSize: 12, iconSize: 15)
                    }
                    if entry.items.allSatisfy({ $0.isDone }) {
                        AllDoneRow(fontSize: 12)
                    }
                }
                
                Spacer(minLength: 0)
            }
            
            // Right Column: Circular Progress Ring & Stats
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 7)
                    Circle()
                        .trim(from: 0, to: CGFloat(entry.progress))
                        .stroke(
                            LinearGradient(colors: [Color.emerald400, Color.teal300], startPoint: .top, endPoint: .bottom),
                            style: StrokeStyle(lineWidth: 7, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .widgetAccentable()
                    
                    VStack(spacing: -1) {
                        Text("\(entry.completedCount)")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                            .widgetAccentable()
                        Text("/\(entry.totalCount)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .frame(width: 66, height: 66)
                
                Text("\(Int(entry.progress * 100))%")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(Color.emerald400)
                    .widgetAccentable()
            }
            .frame(width: 76)
        }
        .padding(12)
    }
}

// MARK: - 3. Large Widget (Apple Reminders Style: 7-8 Checkable Items)
private struct LargeChecklistWidgetView: View {
    let entry: MinestWidgetProvider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Image(systemName: "checklist")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Color.emerald400)
                            .widgetAccentable()
                        Text(entry.boardTitle)
                            .font(.system(size: 15, weight: .heavy))
                            .foregroundColor(.white)
                    }
                    Text(entry.currentCard)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                        .lineLimit(1)
                }
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(entry.completedCount) / \(entry.totalCount)")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(Color.emerald400)
                        .widgetAccentable()
                    Text("\(Int(entry.progress * 100))% 完成")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            
            // Progress Bar
            ProgressView(value: entry.progress)
                .tint(Color.emerald400)
                .widgetAccentable()
            
            Divider().background(Color.white.opacity(0.12))
            
            // Interactive Checklist Items (up to 7)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(entry.items.filter { !$0.isDone }.prefix(7)) { item in
                    ChecklistRowItem(item: item, fontSize: 13, iconSize: 16)
                }
                if entry.items.allSatisfy({ $0.isDone }) {
                    AllDoneRow(fontSize: 13)
                }
            }
            
            Spacer(minLength: 0)
        }
        .padding(14)
    }
}

// MARK: - Interactive Row with Checkbox
/// 31.6: shown when every card in the home list is ticked.
private struct AllDoneRow: View {
    let fontSize: CGFloat
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "checkmark.seal.fill").foregroundColor(Color.emerald400)
            Text("全部完成").font(.system(size: fontSize, weight: .semibold)).foregroundColor(.white.opacity(0.85))
        }
    }
}

private struct ChecklistRowItem: View {
    let item: StudyActivityAttributes.ChecklistItemState
    var fontSize: CGFloat = 12
    var iconSize: CGFloat = 15
    
    var body: some View {
        Button(intent: ToggleChecklistItemIntent(itemId: item.id)) {
            HStack(alignment: .center, spacing: 7) {
                Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: iconSize, weight: .semibold))
                    .foregroundColor(item.isDone ? Color.emerald400 : Color.white.opacity(0.4))
                    .widgetAccentable()
                
                Text(item.text)
                    .font(.system(size: fontSize, weight: item.isDone ? .regular : .medium))
                    .strikethrough(item.isDone, color: Color.white.opacity(0.4))
                    .foregroundColor(item.isDone ? Color.white.opacity(0.4) : Color.white.opacity(0.92))
                    .lineLimit(1)
                
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Color Palette
private extension Color {
    static let emerald400 = Color(red: 52/255, green: 211/255, blue: 153/255)
    static let teal300 = Color(red: 94/255, green: 234/255, blue: 212/255)
    static let cyan400 = Color(red: 34/255, green: 211/255, blue: 238/255)
}
