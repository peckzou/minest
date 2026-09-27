import SwiftUI

/// High-fidelity Native Splash Screen styled directly after the 3D isometric Minest App Icon
/// Features continuous levitation physics, dynamic ground shadow, liquid glass specular sweep,
/// and synchronized audio-tactile checklist stamps.
public struct MinestAppIconSplashView: View {
    let onFinished: () -> Void
    
    // Animation States
    @State private var isCubeVisible = false
    @State private var isFloating = false
    @State private var glintOffset: CGFloat = -180
    @State private var checkPulse1: CGFloat = 0.4
    @State private var checkOpacity1: Double = 0.0
    @State private var checkPulse2: CGFloat = 0.4
    @State private var checkOpacity2: Double = 0.0
    @State private var textTracking: CGFloat = 2
    @State private var textOpacity: Double = 0
    @State private var subtitleOpacity: Double = 0
    @State private var badgeOpacity: Double = 0
    @State private var ambientGlowPulse = false
    @State private var isDismissing = false
    
    public init(onFinished: @escaping () -> Void = {}) {
        self.onFinished = onFinished
    }
    
    public var body: some View {
        ZStack {
            // Minest Theme Background
            Color(red: 11/255, green: 17/255, blue: 23/255)
                .ignoresSafeArea()
            
            // Dynamic Emerald & Cyan Liquid Glow
            RadialGradient(
                colors: [
                    Color(red: 52/255, green: 211/255, blue: 153/255).opacity(ambientGlowPulse ? 0.32 : 0.16),
                    Color(red: 34/255, green: 211/255, blue: 238/255).opacity(0.10),
                    Color.clear
                ],
                center: .center,
                startRadius: 20,
                endRadius: 280
            )
            .scaleEffect(ambientGlowPulse ? 1.15 : 0.92)
            .animation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true), value: ambientGlowPulse)
            .ignoresSafeArea()
            
            VStack(spacing: 28) {
                Spacer()
                
                // Floating Isometric Icon Assembly
                ZStack {
                    // Dynamic Ground Shadow (breathes inversely with hover height)
                    Ellipse()
                        .fill(Color.black.opacity(isFloating ? 0.32 : 0.62))
                        .frame(width: isFloating ? 116 : 142, height: isFloating ? 20 : 28)
                        .blur(radius: isFloating ? 12 : 7)
                        .offset(y: 102)
                        .animation(.easeInOut(duration: 1.9).repeatForever(autoreverses: true), value: isFloating)
                    
                    // Main App Icon with Specular Glint & Interactive Checkmark Flares
                    ZStack {
                        // The Crisp High-Res App Icon
                        Image("SplashIcon")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 154, height: 154)
                            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 34, style: .continuous)
                                    .stroke(
                                        LinearGradient(
                                            colors: [
                                                Color.white.opacity(0.45),
                                                Color(red: 74/255, green: 222/255, blue: 128/255).opacity(0.5),
                                                Color.clear
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1.5
                                    )
                            )
                            .shadow(color: Color(red: 52/255, green: 211/255, blue: 153/255).opacity(0.38), radius: 26, x: 0, y: 12)
                            .shadow(color: Color.black.opacity(0.55), radius: 18, x: 0, y: 10)
                        
                        // Diagonal Liquid Glass Specular Sweep
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.0),
                                        Color.white.opacity(0.2),
                                        Color.white.opacity(0.75),
                                        Color.white.opacity(0.2),
                                        Color.clear
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 60, height: 280)
                            .rotationEffect(.degrees(28))
                            .offset(x: glintOffset)
                            .blendMode(.screen)
                            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
                        
                        // Checklist Flare Stamp 1 (precisely aligned over row 1 checkbox)
                        ZStack {
                            Circle()
                                .fill(Color(red: 74/255, green: 222/255, blue: 128/255))
                                .frame(width: 22, height: 22)
                                .scaleEffect(checkPulse1)
                                .opacity(checkOpacity1)
                                .blur(radius: 4)
                            
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.white)
                                .opacity(checkOpacity1)
                        }
                        .offset(x: -1, y: -1)
                        
                        // Checklist Flare Stamp 2 (precisely aligned over row 2 checkbox)
                        ZStack {
                            Circle()
                                .fill(Color(red: 52/255, green: 211/255, blue: 153/255))
                                .frame(width: 20, height: 20)
                                .scaleEffect(checkPulse2)
                                .opacity(checkOpacity2)
                                .blur(radius: 4)
                            
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white)
                                .opacity(checkOpacity2)
                        }
                        .offset(x: 12, y: 18)
                    }
                    .scaleEffect(isCubeVisible ? 1.0 : 0.65)
                    .offset(y: isFloating ? -8 : 6)
                    .animation(.easeInOut(duration: 1.9).repeatForever(autoreverses: true), value: isFloating)
                }
                .frame(height: 190)
                
                // Typography Section
                VStack(spacing: 8) {
                    Text("MINEST")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .tracking(textTracking)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color.white,
                                    Color(red: 220/255, green: 252/255, blue: 231/255),
                                    Color(red: 74/255, green: 222/255, blue: 128/255)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(textOpacity)
                        .shadow(color: Color(red: 74/255, green: 222/255, blue: 128/255).opacity(0.45), radius: 18)
                    
                    Text("BLOCK BY BLOCK ACTIVE RECALL")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .tracking(2.8)
                        .foregroundColor(Color.white.opacity(0.65))
                        .opacity(subtitleOpacity)
                    
                    // Liquid Pill Status Badge
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(red: 74/255, green: 222/255, blue: 128/255))
                            .frame(width: 6, height: 6)
                            .shadow(color: Color(red: 74/255, green: 222/255, blue: 128/255), radius: 5)
                        
                        Text("3D CUBE & DYNAMIC ISLAND READY")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundColor(Color(red: 187/255, green: 247/255, blue: 208/255))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Color(red: 22/255, green: 101/255, blue: 52/255).opacity(0.38))
                            .overlay(
                                Capsule()
                                    .stroke(Color(red: 74/255, green: 222/255, blue: 128/255).opacity(0.35), lineWidth: 1)
                            )
                    )
                    .opacity(badgeOpacity)
                    .padding(.top, 6)
                }
                
                Spacer()
                
                // Footer Engine Tag
                Text("POWERED BY MINEST LIQUID ENGINE")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundColor(Color.white.opacity(0.32))
                    .tracking(1.6)
                    .padding(.bottom, 24)
            }
            .scaleEffect(isDismissing ? 1.08 : 1.0)
            .opacity(isDismissing ? 0.0 : 1.0)
        }
        .onAppear {
            startAnimationSequence()
        }
    }
    
    private func startAnimationSequence() {
        ambientGlowPulse = true
        
        // 1. Entrance Spring Pop
        withAnimation(.spring(response: 0.65, dampingFraction: 0.68, blendDuration: 0)) {
            isCubeVisible = true
        }
        
        // 2. Start Levitation Floating
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            isFloating = true
        }
        
        // 3. Specular Liquid Glass Glint Sweep
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            withAnimation(.easeInOut(duration: 0.85)) {
                glintOffset = 180
            }
        }
        
        // 4. Checklist Tick 1 + Flare Pulse + Haptic
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.5)) {
                checkPulse1 = 1.3
                checkOpacity1 = 0.95
            }
            NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                withAnimation(.easeOut(duration: 0.3)) {
                    checkPulse1 = 1.0
                    checkOpacity1 = 0.0
                }
            }
        }
        
        // 5. Checklist Tick 2 + Flare Pulse + Haptic
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.80) {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.5)) {
                checkPulse2 = 1.3
                checkOpacity2 = 0.95
            }
            NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                withAnimation(.easeOut(duration: 0.3)) {
                    checkPulse2 = 1.0
                    checkOpacity2 = 0.0
                }
            }
        }
        
        // 6. Typography Staggered Reveal
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.38) {
            withAnimation(.easeOut(duration: 0.55)) {
                textOpacity = 1.0
                textTracking = 6
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.65) {
            withAnimation(.easeOut(duration: 0.45)) {
                subtitleOpacity = 1.0
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.90) {
            withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
                badgeOpacity = 1.0
            }
        }
    }
}
