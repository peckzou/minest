import Foundation
import CoreMotion
import UIKit

/// High-Performance Native Motion Service for Minest
/// Decouples micro-motion (visual Liquid Glass response) from intentional motion (gesture & card actions).
public final class NativeMotionService {
    public static let shared = NativeMotionService()
    
    // MARK: - Motion Data Payloads
    
    /// Visual Motion Data for Physical Liquid Glass Real-Time Rendering
    public struct VisualMotionData {
        public let roll: Double           // Degrees
        public let pitch: Double          // Degrees (calibrated to ~40° resting hand posture)
        public let normalizedX: Double    // Clamped [-1.0, 1.0]
        public let normalizedY: Double    // Clamped [-1.0, 1.0]
        public let specularX: Double      // Specular glint pixel offset [-45px, 45px]
        public let specularY: Double      // Specular glint pixel offset [-35px, 35px]
        public let refractionAngle: Double// Edge refraction light gradient angle (degrees)
        public let shadowOffsetX: Double  // Optical depth shadow offset (opposite to light)
        public let shadowOffsetY: Double  // Optical depth shadow offset (opposite to light)
        public let parallaxDepth: Double  // Sub-layer spatial parallax factor
    }
    
    /// Intentional Motion Data for Physical Card Navigation & Action Triggers
    public struct MotionIntent {
        public enum IntentType {
            case none
            case tiltLeft
            case tiltRight
            case flickComplete
            case faceDown
            case faceUp
            case shakeToDraw
        }
        
        public let type: IntentType
        public let angularVelocity: (x: Double, y: Double, z: Double)
        public let timestamp: Date
    }
    
    // MARK: - Delegates & Callbacks
    public var onVisualMotionUpdate: ((VisualMotionData) -> Void)?
    public var onIntentDetected: ((MotionIntent) -> Void)?
    
    // MARK: - Hardware Motion Engine
    private let motionManager = CMMotionManager()
    private let motionQueue = OperationQueue()
    
    public var isMotionEnabled: Bool = true
    public private(set) var isUpdating: Bool = false
    
    // MARK: - Smoothing & Calibration
    private var smoothedRoll: Double = 0.0
    private var smoothedPitch: Double = 0.0
    private let naturalHoldingPitchOffset: Double = 0.70 // ~40 degrees resting hand tilt
    
    // Adaptive EMA filter coefficients
    private let baseFilterFactor: Double = 0.18
    private let tremorDeadband: Double = 0.008 // In radians (~0.45 deg) to eliminate micro-jitter
    
    // Intent Detection Cooldowns
    private var lastIntentTime: Date = Date.distantPast
    private let intentCooldown: TimeInterval = 0.85
    private var isNeutralState: Bool = true
    private var isDeviceFaceDown: Bool = false
    
    private init() {
        motionQueue.name = "com.minest.motionServiceQueue"
        motionQueue.maxConcurrentOperationCount = 1
        motionQueue.qualityOfService = .userInteractive
    }
    
    // MARK: - Lifecycle Management
    
    public func startUpdates() {
        guard isMotionEnabled, !isUpdating, motionManager.isDeviceMotionAvailable else { return }
        
        // 60Hz update rate for fluid 60fps glass reflections
        let isLowPower = ProcessInfo.processInfo.isLowPowerModeEnabled
        motionManager.deviceMotionUpdateInterval = isLowPower ? (1.0 / 30.0) : (1.0 / 60.0)
        
        smoothedRoll = 0.0
        smoothedPitch = naturalHoldingPitchOffset
        isNeutralState = true
        
        motionManager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: motionQueue) { [weak self] motion, error in
            guard let self = self, let motion = motion, error == nil else { return }
            self.processDeviceMotion(motion)
        }
        isUpdating = true
        print("🎛️ [NativeMotionService] Motion service started (60Hz, decoupled visual/intent pipeline)")
    }
    
    public func stopUpdates() {
        guard isUpdating else { return }
        motionManager.stopDeviceMotionUpdates()
        isUpdating = false
        print("🔋 [NativeMotionService] Motion service paused")
    }
    
    // MARK: - Motion Processing Pipeline
    
    private func processDeviceMotion(_ motion: CMDeviceMotion) {
        // Respect system Accessibility Reduce Motion setting
        if UIAccessibility.isReduceMotionEnabled {
            let neutralData = VisualMotionData(
                roll: 0, pitch: 0, normalizedX: 0, normalizedY: 0,
                specularX: 0, specularY: 0, refractionAngle: 135.0,
                shadowOffsetX: 0, shadowOffsetY: 8.0, parallaxDepth: 0
            )
            DispatchQueue.main.async { [weak self] in
                self?.onVisualMotionUpdate?(neutralData)
            }
            return
        }
        
        // -------------------------------------------------------------
        // LAYER A: Visual Motion Pipeline (Micro-Motion for Liquid Glass)
        // -------------------------------------------------------------
        let rawRoll = motion.attitude.roll
        let rawPitch = motion.attitude.pitch
        
        let deltaRoll = abs(rawRoll - smoothedRoll)
        let deltaPitch = abs(rawPitch - smoothedPitch)
        
        // Apply tremor deadband: ignore human hand micro-tremor to keep glass steady
        if deltaRoll > tremorDeadband {
            let adaptiveFactor = min(1.0, baseFilterFactor + (deltaRoll * 0.4))
            smoothedRoll = smoothedRoll * (1.0 - adaptiveFactor) + rawRoll * adaptiveFactor
        }
        if deltaPitch > tremorDeadband {
            let adaptiveFactor = min(1.0, baseFilterFactor + (deltaPitch * 0.4))
            smoothedPitch = smoothedPitch * (1.0 - adaptiveFactor) + rawPitch * adaptiveFactor
        }
        
        let rollDeg = smoothedRoll * 180.0 / .pi
        let pitchDeg = (smoothedPitch - naturalHoldingPitchOffset) * 180.0 / .pi
        
        // Normalization clamped [-1.0, 1.0] across ±30 degrees of phone tilt
        let normX = min(max(rollDeg / 28.0, -1.0), 1.0)
        let normY = min(max(-pitchDeg / 28.0, -1.0), 1.0)
        
        // Physical Liquid Glass optical metrics:
        // 1. Specular glint shifts with light vector
        let specularX = -normX * 42.0 // px
        let specularY = normY * 32.0  // px
        
        // 2. Edge refraction angle shifts based on orientation (135° base resting angle)
        let refractionAngle = 135.0 + (normX * 55.0) + (normY * 25.0)
        
        // 3. Shadow offset moves INVERSELY to light angle, creating genuine elevation
        let shadowOffsetX = normX * 12.0 // px
        let shadowOffsetY = 12.0 + (-normY * 10.0) // px
        
        // 4. Parallax depth factor (subtle 3D layering)
        let parallaxDepth = (normX * normX + normY * normY) * 4.0
        
        let visualData = VisualMotionData(
            roll: rollDeg,
            pitch: pitchDeg,
            normalizedX: normX,
            normalizedY: normY,
            specularX: specularX,
            specularY: specularY,
            refractionAngle: refractionAngle,
            shadowOffsetX: shadowOffsetX,
            shadowOffsetY: shadowOffsetY,
            parallaxDepth: parallaxDepth
        )
        
        // -------------------------------------------------------------
        // LAYER B: Intent Detection Pipeline (Deliberate Movement Thresholds)
        // -------------------------------------------------------------
        let rotRate = motion.rotationRate
        let rotSpeed = sqrt(rotRate.x * rotRate.x + rotRate.y * rotRate.y + rotRate.z * rotRate.z)
        let gravityZ = motion.gravity.z
        let now = Date()
        
        var detectedIntent: MotionIntent.IntentType = .none
        
        // Check for return to neutral state to prevent repeat triggering
        if abs(normX) < 0.25 && abs(normY) < 0.25 && rotSpeed < 1.0 {
            isNeutralState = true
        }
        
        // 1. Face-down and Face-up transitions (phone placed flat on surface vs picked up)
        if gravityZ > 0.82 && !isDeviceFaceDown {
            detectedIntent = .faceDown
            isDeviceFaceDown = true
            lastIntentTime = now
            isNeutralState = false
        } else if gravityZ < 0.35 && isDeviceFaceDown {
            detectedIntent = .faceUp
            isDeviceFaceDown = false
            lastIntentTime = now
            isNeutralState = true
        } else if !isDeviceFaceDown && now.timeIntervalSince(lastIntentTime) > intentCooldown && isNeutralState {
            // 2. Intentional Deliberate Tilt / Rotation (Threshold: > 35 deg with angular velocity)
            if rollDeg < -35.0 && rotRate.y < -1.8 {
                detectedIntent = .tiltLeft
                lastIntentTime = now
                isNeutralState = false
            } else if rollDeg > 35.0 && rotRate.y > 1.8 {
                detectedIntent = .tiltRight
                lastIntentTime = now
                isNeutralState = false
            }
            // 3. Quick deliberate upward flick (wrist snap)
            else if (rotRate.x < -3.0 && rotSpeed > 3.5) || (motion.userAcceleration.y > 1.8) {
                detectedIntent = .flickComplete
                lastIntentTime = now
                isNeutralState = false
            }
        }
        
        // Hardware Shake Detection (Shake to Draw)
        let userAccel = motion.userAcceleration
        let accelMag = sqrt(userAccel.x * userAccel.x + userAccel.y * userAccel.y + userAccel.z * userAccel.z)
        if accelMag > 2.4 && now.timeIntervalSince(lastIntentTime) > 1.2 {
            detectedIntent = .shakeToDraw
            lastIntentTime = now
        }
        
        // Dispatch to Main Thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onVisualMotionUpdate?(visualData)
            if detectedIntent != .none {
                let intent = MotionIntent(
                    type: detectedIntent,
                    angularVelocity: (rotRate.x, rotRate.y, rotRate.z),
                    timestamp: now
                )
                self.onIntentDetected?(intent)
            }
        }
    }
}
