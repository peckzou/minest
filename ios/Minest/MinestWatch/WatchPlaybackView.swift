import SwiftUI

/// One focusable control. Navigation and favorites never add a second button.
struct WatchPlaybackView: View {
    var onBack: () -> Void
    @ObservedObject private var player = WatchPlaybackModel.shared
    @ObservedObject private var connection = WatchSyncManager.shared
    @Environment(\.scenePhase) private var scenePhase

    private var enabled: Bool {
        connection.isReachable && !player.pending && (player.state?.canAdvance() ?? false)
    }
    private var status: String? {
        if !connection.isReachable { return "iPhone 暂不可达" }
        if player.pending { return "等待手机确认…" }
        if let message = player.message { return message }
        guard let state = player.state, state.active else { return "先在 iPhone 开始播放" }
        if !state.canAdvance() { return state.isGPT ? "已到最后一张" : "只有一张卡片" }
        return nil
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 8) {
                Text("Minest · Study Remote")
                    .font(.system(size: 12)).foregroundStyle(.secondary)
                    .lineLimit(1).minimumScaleFactor(0.7).accessibilityHidden(true)
                nextButton
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                Text("Swipe right to go back")
                    .font(.system(size: 10)).foregroundStyle(.secondary)
                    .lineLimit(1).minimumScaleFactor(0.7).accessibilityHidden(true)
            }
            .padding(.horizontal, 4).padding(.vertical, 5)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
            // Custom edge-back for the existing page navigation (not a new stack).
            // A recognized drag takes precedence over the button, so Back cannot send Next.
            .highPriorityGesture(DragGesture(minimumDistance: 24).onEnded { value in
                guard value.startLocation.x <= min(56, geometry.size.width * 0.3),
                      value.translation.width >= 50,
                      abs(value.translation.height) < value.translation.width * 0.6 else { return }
                onBack()
            })
        }
        .navigationBarBackButtonHidden(true)
        .onAppear { player.requestState(force: true) }
        .onChange(of: connection.isReachable) { if $0 { player.requestState(force: true) } }
        .onChange(of: scenePhase) { if $0 == .active { player.requestState(force: true) } }
    }

    @ViewBuilder private var nextButton: some View {
        if #available(watchOS 11.0, *) {
            control.handGestureShortcut(.primaryAction, isEnabled: enabled)
        } else { control }
    }

    private var control: some View {
        Button { if enabled { player.next() } else { player.requestState(force: true) } } label: {
            VStack(spacing: 12) {
                Image(systemName: "forward.end")
                    .font(.system(size: 32, weight: .medium))
                Text("Next Card").font(.system(size: 23, weight: .semibold))
                    .lineLimit(1).minimumScaleFactor(0.7)
                if let status {
                    Text(status).font(.system(size: 11)).foregroundStyle(.secondary)
                        .multilineTextAlignment(.center).lineLimit(2)
                }
            }
            .foregroundStyle(.white).frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(10)
            .background(Color(red: 0.14, green: 0.16, blue: 0.19), in: RoundedRectangle(cornerRadius: 24))
            .contentShape(RoundedRectangle(cornerRadius: 24))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Next Card")
        .accessibilityIdentifier("watch.playback.next")
        .accessibilityValue(status ?? "下一张")
        .accessibilityHint("轻点切换下一张，长按收藏；从左边缘右滑返回")
        .accessibilityAction(.escape, onBack)
        .accessibilityAction(named: Text("收藏当前卡片")) { player.favoriteCurrent() }
        // A successful long press consumes the touch; releasing it must not also send Next.
        .highPriorityGesture(
            LongPressGesture(minimumDuration: 0.7).exclusively(before: TapGesture())
                .onEnded { result in
                    switch result {
                    case .first: player.favoriteCurrent()
                    case .second:
                        if enabled { player.next() } else { player.requestState(force: true) }
                    }
                }
        )
    }
}
