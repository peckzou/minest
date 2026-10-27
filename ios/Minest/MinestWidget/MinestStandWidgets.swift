import SwiftUI
import WidgetKit
import AppIntents

// MARK: - Stand Mode widgets: Octo Clock · My Collection (StandBy, also Home Screen)
//
// Two small widgets the person adds in the system widget gallery (StandBy: iPhone on its side while charging). They only
// read what the Minest app wrote into the App Group (MinestStandStore): still Octo poses and — when the person allowed
// it in Stand settings — a few collection pictures. The time is the system's own live text; the timeline only changes
// Octo's pose a few times a day and turns the collection pieces, so it stays well inside WidgetKit's refresh budget.

// MARK: Configuration

enum StandClockStyle: String, AppEnum {
    case minimal, aquarium, cozy
    static var typeDisplayRepresentation: TypeDisplayRepresentation { "Clock style" }
    static var caseDisplayRepresentations: [StandClockStyle: DisplayRepresentation] { [.minimal: "Minimal", .aquarium: "Aquarium", .cozy: "Cozy Desk"] }
}

enum StandHourFormat: String, AppEnum {
    case system, twelve, twentyFour
    static var typeDisplayRepresentation: TypeDisplayRepresentation { "Time format" }
    static var caseDisplayRepresentations: [StandHourFormat: DisplayRepresentation] { [.system: "System", .twelve: "12-hour", .twentyFour: "24-hour"] }
}

enum StandSecondary: String, AppEnum {
    case none, date, word
    static var typeDisplayRepresentation: TypeDisplayRepresentation { "Below the time" }
    static var caseDisplayRepresentations: [StandSecondary: DisplayRepresentation] { [.date: "Date", .word: "Next study word", .none: "Nothing"] }
}

enum StandShowStyle: String, AppEnum {
    case museum, shelf, wall, mini
    static var typeDisplayRepresentation: TypeDisplayRepresentation { "Showcase style" }
    static var caseDisplayRepresentations: [StandShowStyle: DisplayRepresentation] { [.museum: "Museum", .shelf: "Collectible Shelf", .wall: "Gallery Wall", .mini: "Miniature Display"] }
}

struct OctoClockConfig: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Octo Clock"
    static var description = IntentDescription("Octo keeps you company on your desk.")
    @Parameter(title: "Style", default: .minimal) var style: StandClockStyle
    @Parameter(title: "Time format", default: .system) var format: StandHourFormat
    @Parameter(title: "Below the time", default: .date) var secondary: StandSecondary
}

struct CollectionConfig: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "My Collection"
    static var description = IntentDescription("Pieces you chose in Minest ▸ Stand Mode, on show.")
    @Parameter(title: "Style", default: .museum) var style: StandShowStyle
    @Parameter(title: "Turn the pieces", default: true) var rotate: Bool
}

// MARK: Shared look

private func standImage(_ name: String?) -> Image? {
    guard let data = MinestStandStore.image(name), let ui = UIImage(data: data) else { return nil }
    return Image(uiImage: ui)
}

private struct OctoView: View {
    let pose: String
    var body: some View {
        if let img = standImage("octo-\(pose).img") {
            img.resizable().scaledToFit()
                .rotationEffect(.degrees(pose == "sleeping" ? -8 : 0))
                .shadow(color: .black.opacity(0.25), radius: 6, y: 4)
        } else {
            Text("🐙").font(.system(size: 40))   // before the app has drawn Octo once
        }
    }
}

/// Live system time, 12 / 24 h as chosen (the locale decides for "System").
private struct LiveTime: View {
    let date: Date
    let format: StandHourFormat
    var body: some View {
        Group {
            if #available(iOS 18.0, *) {
                Text(.currentDate, format: .dateTime.hour().minute())
            } else {
                Text(date, style: .time)
            }
        }
        .environment(\.locale, locale)
        .monospacedDigit()
    }
    private var locale: Locale {
        switch format {
        case .system: return .current
        case .twelve: return Locale(identifier: (Locale.current.language.languageCode?.identifier ?? "en") + "_US")
        case .twentyFour: return Locale(identifier: (Locale.current.language.languageCode?.identifier ?? "en") + "_GB")
        }
    }
}

// MARK: - Octo Clock

struct OctoClockEntry: TimelineEntry {
    let date: Date
    let pose: String
    let word: String
    let config: OctoClockConfig
}

struct OctoClockProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> OctoClockEntry { OctoClockEntry(date: Date(), pose: "happy", word: "", config: OctoClockConfig()) }
    func snapshot(for configuration: OctoClockConfig, in context: Context) async -> OctoClockEntry { entry(Date(), configuration) }
    func timeline(for configuration: OctoClockConfig, in context: Context) async -> Timeline<OctoClockEntry> {
        let now = Date()
        // iOS 17 has no live current-date text: one entry a minute for the next hour there; iOS 18: only the pose changes
        if #available(iOS 18.0, *) {
            let marks = MinestStandStore.poseChanges(after: now, count: 4)
            return Timeline(entries: [entry(now, configuration)] + marks.map { entry($0, configuration) }, policy: .atEnd)
        }
        let start = Calendar.current.dateInterval(of: .minute, for: now)?.start ?? now
        let minutes = (0..<60).map { start.addingTimeInterval(Double($0) * 60) }
        return Timeline(entries: minutes.map { entry($0, configuration) }, policy: .atEnd)
    }
    private func entry(_ d: Date, _ c: OctoClockConfig) -> OctoClockEntry {
        OctoClockEntry(date: d, pose: MinestStandStore.pose(at: d), word: MinestStandStore.load()?.word ?? "", config: c)
    }
}

struct OctoClockView: View {
    let entry: OctoClockEntry
    @Environment(\.widgetRenderingMode) private var mode

    var body: some View {
        let c = entry.config
        ZStack(alignment: .bottomTrailing) {
            VStack(alignment: c.style == .minimal ? .leading : .trailing, spacing: 2) {
                LiveTime(date: entry.date, format: c.format)
                    .font(.system(size: 40, weight: c.style == .minimal ? .light : .regular, design: .rounded))
                    .minimumScaleFactor(0.5).lineLimit(1)
                secondary.font(.system(size: 12, weight: .medium)).foregroundStyle(.secondary).lineLimit(1)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: c.style == .minimal ? .leading : .trailing)
            OctoView(pose: entry.pose)
                .frame(width: c.style == .minimal ? 54 : 74, height: c.style == .minimal ? 54 : 74)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: c.style == .minimal ? .bottomTrailing : .bottomLeading)
        }
        .foregroundStyle(c.style == .minimal ? Color.primary : Color.white)
        .containerBackground(for: .widget) { background(c.style) }
        .widgetURL(URL(string: "minest://stand"))
    }

    @ViewBuilder private var secondary: some View {
        switch entry.config.secondary {
        case .date: Text(entry.date, format: .dateTime.weekday(.abbreviated).month(.abbreviated).day())
        case .word: Text(entry.word.isEmpty ? " " : "Next · \(entry.word)")
        case .none: EmptyView()
        }
    }

    @ViewBuilder private func background(_ s: StandClockStyle) -> some View {
        switch s {
        case .minimal:
            Color(.systemBackground)
        case .aquarium:
            ZStack(alignment: .bottom) {
                LinearGradient(colors: [Color(red: 0.17, green: 0.44, blue: 0.56), Color(red: 0.06, green: 0.19, blue: 0.29)], startPoint: .top, endPoint: .bottom)
                LowPolyFloor().fill(Color(red: 0.79, green: 0.71, blue: 0.54)).frame(height: 34)
            }
        case .cozy:
            ZStack(alignment: .bottom) {
                RadialGradient(colors: [Color(red: 1, green: 0.77, blue: 0.47).opacity(0.45), .clear], center: .topLeading, startRadius: 4, endRadius: 140)
                    .background(LinearGradient(colors: [Color(red: 0.23, green: 0.16, blue: 0.13), Color(red: 0.11, green: 0.08, blue: 0.07)], startPoint: .top, endPoint: .bottom))
                Rectangle().fill(Color(red: 0.48, green: 0.32, blue: 0.22)).frame(height: 26)
            }
        }
    }
}

private struct LowPolyFloor: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let ys: [CGFloat] = [0.45, 0.15, 0.4, 0.05, 0.35, 0.1, 0.3]
        p.move(to: CGPoint(x: 0, y: r.maxY))
        for (i, y) in ys.enumerated() { p.addLine(to: CGPoint(x: r.width * CGFloat(i) / CGFloat(ys.count - 1), y: r.minY + r.height * y)) }
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY)); p.closeSubpath()
        return p
    }
}

struct MinestOctoClockWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: MinestStandStore.clockKind, intent: OctoClockConfig.self, provider: OctoClockProvider()) { entry in
            OctoClockView(entry: entry)
        }
        .configurationDisplayName("Octo Clock")
        .description("A desk clock with Octo — for StandBy and your Home Screen.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - My Collection

struct CollectionEntry: TimelineEntry {
    let date: Date
    let items: [StandItem]   // the pieces in view (one, or a few for the shelf / wall)
    let config: CollectionConfig
    let pose: String
}

struct CollectionProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> CollectionEntry { CollectionEntry(date: Date(), items: [], config: CollectionConfig(), pose: "happy") }
    func snapshot(for configuration: CollectionConfig, in context: Context) async -> CollectionEntry { entries(Date(), configuration, 1)[0] }
    func timeline(for configuration: CollectionConfig, in context: Context) async -> Timeline<CollectionEntry> {
        let list = entries(Date(), configuration, configuration.rotate ? 18 : 1)   // 18 × 20 min = 6 hours, then the system reloads
        return Timeline(entries: list, policy: configuration.rotate ? .atEnd : .never)
    }
    private func entries(_ now: Date, _ c: CollectionConfig, _ n: Int) -> [CollectionEntry] {
        let all = MinestStandStore.load()?.items ?? []
        let per = c.style == .shelf ? 3 : c.style == .wall ? 4 : 1
        return (0..<max(1, n)).map { k in
            let d = now.addingTimeInterval(Double(k) * 20 * 60)
            let pick = all.isEmpty ? [] : (0..<min(per, all.count)).map { all[(k * per + $0) % all.count] }
            return CollectionEntry(date: d, items: pick, config: c, pose: MinestStandStore.pose(at: d))
        }
    }
}

struct CollectionView: View {
    let entry: CollectionEntry

    var body: some View {
        content
            .containerBackground(for: .widget) { LinearGradient(colors: [Color(red: 0.09, green: 0.1, blue: 0.13), Color(red: 0.05, green: 0.06, blue: 0.08)], startPoint: .top, endPoint: .bottom) }
            .widgetURL(URL(string: entry.items.first.map { "minest://card?id=" + ($0.id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") } ?? "minest://stand"))
    }

    @ViewBuilder private var content: some View {
        if entry.items.isEmpty {
            // nothing allowed / chosen yet: Octo and a pointer, never someone's pictures
            VStack(spacing: 6) {
                OctoView(pose: entry.pose).frame(width: 64, height: 64)
                Text("Choose pieces in Minest ▸ Stand").font(.system(size: 11, weight: .medium)).multilineTextAlignment(.center).foregroundStyle(.white.opacity(0.75))
            }
        } else {
            switch entry.config.style {
            case .museum: museum(entry.items[0])
            case .shelf: shelf
            case .wall: wall
            case .mini: mini(entry.items[0])
            }
        }
    }

    private func art(_ it: StandItem) -> some View {
        Group {
            if let img = standImage(it.file) { img.resizable().scaledToFill() }
            else { ZStack { Color(red: 0.95, green: 0.92, blue: 0.86); Text(it.title).font(.system(size: 11, weight: .semibold, design: .serif)).foregroundStyle(Color(red: 0.16, green: 0.14, blue: 0.1)).padding(6).minimumScaleFactor(0.6) } }
        }
        .clipped()
    }

    private func museum(_ it: StandItem) -> some View {
        VStack(spacing: 6) {
            art(it).padding(5).background(Color(red: 0.96, green: 0.94, blue: 0.9)).overlay(Rectangle().stroke(Color(red: 0.23, green: 0.18, blue: 0.15), lineWidth: 4))
                .shadow(color: .black.opacity(0.5), radius: 8, y: 6)
            Text(it.title).font(.system(size: 11, weight: .semibold)).foregroundStyle(.white).lineLimit(1)
        }
    }

    private var shelf: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(Array(entry.items.enumerated()), id: \.offset) { i, it in
                    art(it).frame(width: 36, height: i == 1 ? 58 : 48).clipShape(RoundedRectangle(cornerRadius: 3)).shadow(color: .black.opacity(0.45), radius: 4, y: 3)
                }
            }
            Rectangle().fill(Color(red: 0.63, green: 0.45, blue: 0.3)).frame(height: 7)
            Rectangle().fill(Color(red: 0.43, green: 0.29, blue: 0.19)).frame(height: 4)
            Spacer(minLength: 0)
        }
    }

    private var wall: some View {
        let cols = [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)]
        return LazyVGrid(columns: cols, spacing: 6) {
            ForEach(Array(entry.items.enumerated()), id: \.offset) { i, it in
                art(it).frame(height: 56).padding(2).background(Color(red: 0.96, green: 0.94, blue: 0.9))
                    .overlay(Rectangle().stroke(i % 2 == 0 ? Color(red: 0.17, green: 0.14, blue: 0.11) : Color(red: 0.79, green: 0.66, blue: 0.42), lineWidth: 2.5))
            }
        }
    }

    private func mini(_ it: StandItem) -> some View {
        VStack(spacing: 0) {
            ZStack {
                Ellipse().fill(Color.white.opacity(0.07)).overlay(Ellipse().stroke(Color.white.opacity(0.25), lineWidth: 1))
                art(it).frame(width: 64, height: 64).clipShape(RoundedRectangle(cornerRadius: 6)).rotation3DEffect(.degrees(-14), axis: (x: 0, y: 1, z: 0)).shadow(color: .black.opacity(0.4), radius: 5, y: 4)
            }
            .frame(width: 104, height: 92)
            Rectangle().fill(Color(red: 0.85, green: 0.83, blue: 0.8)).frame(width: 120, height: 6)
            Rectangle().fill(Color(red: 0.74, green: 0.71, blue: 0.67)).frame(width: 112, height: 16)
        }
    }
}

struct MinestCollectionWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: MinestStandStore.collectionKind, intent: CollectionConfig.self, provider: CollectionProvider()) { entry in
            CollectionView(entry: entry)
        }
        .configurationDisplayName("My Collection")
        .description("Posters, covers and collectibles you chose in Minest ▸ Stand Mode.")
        .supportedFamilies([.systemSmall])
    }
}
