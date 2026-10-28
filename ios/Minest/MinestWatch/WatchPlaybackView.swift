import SwiftUI

/// The iPhone owns playback; this screen displays its timeline and sends explicit commands.
struct WatchPlaybackView: View {
    var onBack: () -> Void

    @ObservedObject private var player = WatchPlaybackModel.shared
    @ObservedObject private var connection = WatchSyncManager.shared
    @Environment(\.scenePhase) private var scenePhase
    @State private var fullText: String?

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            VStack(spacing: 6) {
                // First interactive element, always visible above the scrolling details.
                if let state = player.state, state.active {
                    nextButton(enabled: connection.isReachable && !player.pending && state.canAdvance(at: context.date))
                        .padding(.horizontal, 4)
                }
                ScrollView {
                    VStack(spacing: 10) {
                        if let state = player.state, state.active {
                            let index = state.index(at: context.date)
                            Text(state.listName.isEmpty ? "卡片播放" : state.listName)
                                .font(.caption).foregroundStyle(.secondary).lineLimit(2)
                            Text(state.cards[index]?.text ?? "请同步以查看当前卡片")
                                .font(.title3.weight(.semibold)).multilineTextAlignment(.center)
                                .lineLimit(3)
                                .onTapGesture { fullText = state.cards[index]?.text }
                                .frame(maxWidth: .infinity, minHeight: 64).fixedSize(horizontal: false, vertical: true)
                                .accessibilityLabel("当前卡片：\(state.cards[index]?.text ?? "尚未缓存")")
                            HStack {
                                Text("\(index + 1) / \(state.total)")
                                Spacer()
                                Text(state.paused ? "已暂停" : state.isGPT ? "学习中" : "播放中")
                            }
                            .font(.caption2).foregroundStyle(.secondary)
                            Button {
                                player.setPaused(!state.paused)
                            } label: {
                                Label(state.paused ? "继续播放" : "暂停播放", systemImage: state.paused ? "play.fill" : "pause.fill")
                            }
                            .disabled(!connection.isReachable || player.pending)
                            if player.pending { ProgressView("等待手机确认").font(.caption2) }
                            if state.isGPT && !state.canAdvance(at: context.date) {
                                Text("已到最后一张").font(.caption2).foregroundStyle(.secondary)
                            }
                            Text("与 iPhone / CarPlay 同步")
                                .font(.caption2).foregroundStyle(.secondary)
                        } else {
                            Image(systemName: "rectangle.stack.badge.play.fill").font(.largeTitle).foregroundStyle(.mint)
                            Text("卡片遥控器").font(.headline)
                            Text("先在 iPhone Duo 的卡片播放 / CarPlay 面板开始播放，再从这里控制。")
                                .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        }
                        if !connection.isReachable {
                            Label("iPhone 暂不可达", systemImage: "iphone.slash")
                                .font(.caption2).foregroundStyle(.orange)
                            Text("显示的是缓存进度；不会排队发送下一张。")
                                .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        }
                        if let message = player.message {
                            Text(message).font(.caption2).foregroundStyle(.orange)
                                .multilineTextAlignment(.center).accessibilityAddTraits(.updatesFrequently)
                        }
                        Button {
                            player.requestState(force: true)
                        } label: { Label("同步手机", systemImage: "arrow.triangle.2.circlepath") }
                            .font(.caption).disabled(!connection.isReachable || player.requesting)
                        Text("支持系统双指互点的手表，可在此页抬腕后双指互点两下切换下一张。")
                            .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }.padding(.horizontal, 4)
                }
                HStack {
                    Button(action: onBack) {
                        Label("返回", systemImage: "chevron.left")
                            .font(.caption)
                    }
                    .accessibilityLabel("返回活动首页")
                    .accessibilityIdentifier("watch.playback.back")
                    .accessibilitySortPriority(-100)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 4)
            }
            .onChange(of: context.date) { _ in
                if let state = player.state, state.active,
                   state.cards[state.index(at: context.date)] == nil {
                    player.requestState()
                }
            }
        }
        .navigationTitle("卡片播放")
        .navigationBarBackButtonHidden(true)
        .sheet(isPresented: Binding(get: { fullText != nil }, set: { if !$0 { fullText = nil } })) {
            ScrollView { Text(fullText ?? "").padding() }
        }
        .onAppear { player.requestState(force: true) }
        .onChange(of: connection.isReachable) { connected in if connected { player.requestState(force: true) } }
        .onChange(of: scenePhase) { phase in if phase == .active { player.requestState(force: true) } }
    }

    @ViewBuilder
    private func nextButton(enabled: Bool) -> some View {
        if #available(watchOS 11.0, *) {
            nextControl.disabled(!enabled).handGestureShortcut(.primaryAction, isEnabled: enabled)
        } else {
            nextControl.disabled(!enabled)
        }
    }

    private var nextControl: some View {
        Button { player.next() } label: {
            Label("下一张", systemImage: "forward.end.fill")
                .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 4)
        }
        .tint(.mint).buttonStyle(.borderedProminent)
        .accessibilityLabel("下一张")
        .accessibilityIdentifier("watch.playback.next")
        .accessibilitySortPriority(100)
        .accessibilityHint("切换 iPhone 与 CarPlay 正在播放的卡片")
    }
}
