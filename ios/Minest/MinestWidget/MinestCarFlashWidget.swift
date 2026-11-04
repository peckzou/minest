import SwiftUI
import WidgetKit
import AppIntents

// MARK: - 车载闪卡 widget (CarPlay Dashboard · also Home Screen)
//
// One English word, big, and small round buttons: ★ (study this more), Pause / Resume, Next. A card ChatGPT's report
// marked shows 🔊 / 💬 under the word. 53.831: per-card durations (reading time) shape the timeline. The words come from the shared playlist
// (CarFlashStore) and are laid out on a timeline — one entry per word change — so the Dashboard keeps changing words
// while the Minest app is suspended. Pause / Resume rebuilds the timeline (CarFlashWidgetToggleIntent).
// Add it once: iPhone Settings → General → CarPlay → your car → Widgets → Minest 车载闪卡.

struct CarFlashEntry: TimelineEntry {
    let date: Date
    let word: String
    let listName: String
    let paused: Bool
    let playing: Bool
    var starred: Bool = false
    var tag: String = ""
}

struct CarFlashProvider: TimelineProvider {
    private static let maxEntries = 240   // e.g. 40 minutes at 10 s; the timeline reloads itself at its end

    func placeholder(in context: Context) -> CarFlashEntry {
        CarFlashEntry(date: Date(), word: "PHOTOSYNTHESIS", listName: "", paused: false, playing: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (CarFlashEntry) -> Void) {
        completion(entry(at: Date(), playlist: CarFlashStore.load()) ?? placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CarFlashEntry>) -> Void) {
        let now = Date()
        guard let p = CarFlashStore.load(), !p.words.isEmpty else {
            completion(Timeline(entries: [CarFlashEntry(date: now, word: "", listName: "", paused: false, playing: false)], policy: .never))
            return
        }
        if p.paused || p.isGPT {   // GPT Study: the card stays until Next (⏱ Auto: the app moves it) — no timeline
            completion(Timeline(entries: [entry(at: now, playlist: p)!], policy: .never))
            return
        }
        // one entry now, then one at every word boundary
        var entries = [entry(at: now, playlist: p)!]
        var next = p.nextChange(after: now)   // each card its own time (🧠 自动) or the fixed interval
        while entries.count < Self.maxEntries {
            entries.append(entry(at: next.addingTimeInterval(0.01), playlist: p)!)
            next = p.nextChange(after: next.addingTimeInterval(0.01))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(at date: Date, playlist p: CarFlashPlaylist?) -> CarFlashEntry? {
        guard let p, !p.words.isEmpty else { return nil }
        return CarFlashEntry(date: date, word: p.word(at: date), listName: p.listName, paused: p.paused, playing: true,
                             starred: p.starredCard(at: date), tag: p.tag(at: date))
    }
}

struct CarFlashWidgetView: View {
    let entry: CarFlashEntry

    var body: some View {
        Group {
            if entry.playing {
                VStack(spacing: 6) {
                    Text(entry.word.uppercased())
                        .font(.system(size: 30, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .minimumScaleFactor(0.3)
                        .allowsTightening(true)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .contentTransition(.opacity)
                    if !entry.tag.isEmpty {
                        Text(entry.tag.split(separator: " ").map { $0 == "pron" ? "🔊 发音" : "💬 意思" }.joined(separator: " · "))
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 253/255, green: 230/255, blue: 138/255))
                    }
                    HStack(spacing: 12) {
                        // ★ study this card more (left of Pause)
                        Button(intent: CarFlashStarIntent()) {
                            Image(systemName: entry.starred ? "star.fill" : "star")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(entry.starred ? .black : .white)
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(entry.starred ? Color.yellow : Color.white.opacity(0.22)))
                                .accessibilityLabel(entry.starred ? "Unstar" : "Star")
                        }
                        .buttonStyle(.plain)
                        Button(intent: CarFlashWidgetToggleIntent()) {
                            Image(systemName: entry.paused ? "play.fill" : "pause.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.black)
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(entry.paused ? Color.orange : Color(red: 93/255, green: 220/255, blue: 229/255)))
                                .accessibilityLabel(entry.paused ? "Resume" : "Pause")
                        }
                        .buttonStyle(.plain)
                        // the next word right away (the timeline's own changes can come late on the Dashboard)
                        Button(intent: CarFlashNextIntent()) {
                            Image(systemName: "forward.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(Color.white.opacity(0.22)))
                                .accessibilityLabel("Next")
                        }
                        .buttonStyle(.plain)
                    }
                }
            } else {
                VStack(spacing: 6) {
                    Image(systemName: "car.fill").font(.system(size: 22)).foregroundColor(.white.opacity(0.7))
                    Text("在 Minest 里开始车载闪卡")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.75))
                        .multilineTextAlignment(.center)
                }
            }
        }
        .containerBackground(Color.black, for: .widget)
    }
}

struct MinestCarFlashWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: CarFlashStore.widgetKind, provider: CarFlashProvider()) { entry in
            CarFlashWidgetView(entry: entry)
        }
        .configurationDisplayName("Minest 车载闪卡")
        .description("开车时显示当前英文单词，自动切换；★ 收藏，⏸ 暂停／继续，⏭ 下一个。")
        .supportedFamilies([.systemSmall])
    }
}
