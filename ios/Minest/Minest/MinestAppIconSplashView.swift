import SwiftUI

/// High-fidelity Native Splash Screen styled directly after the Apple Music Sonic Ripple Minest App Icon
/// Features continuous levitation physics, concentric acoustic water-wave rings, liquid glass specular sweep,
/// and prismatic cyan/cobalt/amber dispersion glow.
public struct MinestAppIconSplashView: View {
    let onFinished: () -> Void
    
    // Animation States
    @State private var isCubeVisible = false
    @State private var isFloating = false
    @State private var glintOffset: CGFloat = -180
    @State private var rippleScale1: CGFloat = 0.72
    @State private var rippleOpacity1: Double = 0.0
    @State private var rippleScale2: CGFloat = 0.72
    @State private var rippleOpacity2: Double = 0.0
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
            // Studio Porcelain & Liquid Glass Backdrop
            LinearGradient(
                colors: [
                    Color(red: 244/255, green: 246/255, blue: 252/255),
                    Color(red: 230/255, green: 235/255, blue: 246/255)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Dynamic Prismatic Cyan, Cobalt & Warm Amber Sonic Glow
            RadialGradient(
                colors: [
                    Color(red: 0/255, green: 216/255, blue: 255/255).opacity(ambientGlowPulse ? 0.24 : 0.12),
                    Color(red: 18/255, green: 69/255, blue: 255/255).opacity(0.10),
                    Color(red: 255/255, green: 159/255, blue: 10/255).opacity(0.08),
                    Color.clear
                ],
                center: .center,
                startRadius: 24,
                endRadius: 310
            )
            .scaleEffect(ambientGlowPulse ? 1.15 : 0.92)
            .animation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true), value: ambientGlowPulse)
            .ignoresSafeArea()
            
            VStack(spacing: 28) {
                Spacer()
                
                // Floating Sonic Ripple Icon Assembly
                ZStack {
                    // Dynamic Studio Shadow
                    Ellipse()
                        .fill(Color(red: 28/255, green: 42/255, blue: 78/255).opacity(isFloating ? 0.14 : 0.26))
                        .frame(width: isFloating ? 116 : 142, height: isFloating ? 20 : 28)
                        .blur(radius: isFloating ? 14 : 8)
                        .offset(y: 102)
                        .animation(.easeInOut(duration: 1.9).repeatForever(autoreverses: true), value: isFloating)
                    
                    // Expanding Acoustic Water-Wave Ring 1
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(red: 0/255, green: 218/255, blue: 255/255).opacity(0.65),
                                    Color.white.opacity(0.9),
                                    Color(red: 255/255, green: 162/255, blue: 10/255).opacity(0.6)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2.2
                        )
                        .frame(width: 164, height: 164)
                        .scaleEffect(rippleScale1)
                        .opacity(rippleOpacity1)
                    
                    // Expanding Acoustic Water-Wave Ring 2
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(red: 18/255, green: 69/255, blue: 255/255).opacity(0.55),
                                    Color.white.opacity(0.85),
                                    Color(red: 0/255, green: 218/255, blue: 255/255).opacity(0.55)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            lineWidth: 1.8
                        )
                        .frame(width: 164, height: 164)
                        .scaleEffect(rippleScale2)
                        .opacity(rippleOpacity2)
                    
                    // Main App Icon with Liquid Glass Specular Glint
                    ZStack {
                        Image("SplashIcon")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 156, height: 156)
                            .clipShape(RoundedRectangle(cornerRadius: 35, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 35, style: .continuous)
                                    .stroke(
                                        LinearGradient(
                                            colors: [
                                                Color(red: 255/255, green: 168/255, blue: 12/255).opacity(0.65),
                                                Color(red: 0/255, green: 220/255, blue: 255/255).opacity(0.75),
                                                Color.white.opacity(0.85),
                                                Color(red: 18/255, green: 69/255, blue: 255/255).opacity(0.65)
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1.6
                                    )
                            )
                            .shadow(color: Color(red: 0/255, green: 180/255, blue: 255/255).opacity(0.22), radius: 24, x: -4, y: 10)
                            .shadow(color: Color(red: 20/255, green: 32/255, blue: 60/255).opacity(0.18), radius: 18, x: 0, y: 10)
                        
                        // Diagonal Liquid Glass Specular Sweep
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.0),
                                        Color.white.opacity(0.22),
                                        Color.white.opacity(0.82),
                                        Color.white.opacity(0.22),
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
                            .clipShape(RoundedRectangle(cornerRadius: 35, style: .continuous))
                    }
                    .scaleEffect(isCubeVisible ? 1.0 : 0.68)
                    .offset(y: isFloating ? -8 : 6)
                    .animation(.easeInOut(duration: 1.9).repeatForever(autoreverses: true), value: isFloating)
                }
                .frame(height: 190)
                
                // Typography Section
                VStack(spacing: 8) {
                    Text("minest")
                        .font(.system(size: 30, weight: .heavy, design: .default))
                        .tracking(textTracking)
                        .foregroundStyle(Color(red: 18/255, green: 22/255, blue: 33/255))
                        .shadow(color: Color(red: 0/255, green: 216/255, blue: 255/255).opacity(0.45), radius: 1, x: -1.5, y: 0)
                        .shadow(color: Color(red: 255/255, green: 152/255, blue: 0/255).opacity(0.42), radius: 1, x: 1.5, y: 0)
                        .opacity(textOpacity)
                    
                    Text("SONIC LIQUID GLASS · DAY FLOW")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .tracking(2.6)
                        .foregroundColor(Color(red: 60/255, green: 72/255, blue: 96/255).opacity(0.78))
                        .opacity(subtitleOpacity)
                    
                    // Liquid Pill Status Badge
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(red: 0/255, green: 195/255, blue: 255/255))
                            .frame(width: 6, height: 6)
                            .shadow(color: Color(red: 0/255, green: 195/255, blue: 255/255), radius: 4)
                        
                        Text("LIQUID GLASS & SONIC RIPPLE READY")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundColor(Color(red: 28/255, green: 44/255, blue: 76/255))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Color.white.opacity(0.72))
                            .overlay(
                                Capsule()
                                    .stroke(Color(red: 0/255, green: 195/255, blue: 255/255).opacity(0.35), lineWidth: 1)
                            )
                    )
                    .opacity(badgeOpacity)
                    .padding(.top, 6)
                }
                
                Spacer()
                
                // Footer Engine Tag
                Text("POWERED BY MINEST LIQUID ENGINE")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundColor(Color(red: 60/255, green: 72/255, blue: 96/255).opacity(0.45))
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
        
        // 4. Sonic Ripple Wave 1 + Haptic
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
            rippleOpacity1 = 0.85
            withAnimation(.easeOut(duration: 0.85)) {
                rippleScale1 = 1.48
                rippleOpacity1 = 0.0
            }
            NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
        }
        
        // 5. Sonic Ripple Wave 2 + Haptic
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.72) {
            rippleOpacity2 = 0.75
            withAnimation(.easeOut(duration: 0.85)) {
                rippleScale2 = 1.56
                rippleOpacity2 = 0.0
            }
            NativeSoundAndHaptics.shared.playChecklistTick(isDone: true)
        }
        
        // 6. Typography Staggered Reveal
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.38) {
            withAnimation(.easeOut(duration: 0.55)) {
                textOpacity = 1.0
                textTracking = -0.5
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
