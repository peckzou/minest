import Foundation
import CoreMotion
import UIKit

/// High-performance CoreMotion Gyroscope & Accelerometer Bridge Adapter
/// Routes events from NativeMotionService into MinestBridge and WKWebView
public final class NativeMotionManager {
    public static let shared = NativeMotionManager()
    
    public weak var bridge: MinestBridge?
    public var isMotionEnabled: Bool {
        get { NativeMotionService.shared.isMotionEnabled }
        set { NativeMotionService.shared.isMotionEnabled = newValue }
    }
    
    private init() {
        setupServiceBindings()
    }
    
    private func setupServiceBindings() {
        NativeMotionService.shared.onVisualMotionUpdate = { [weak self] data in
            guard let self = self else { return }
            self.bridge?.sendTilt(
                x: data.normalizedX,
                y: data.normalizedY,
                roll: data.roll,
                pitch: data.pitch,
                specularX: data.specularX,
                specularY: data.specularY,
                refractionAngle: data.refractionAngle,
                shadowOffsetX: data.shadowOffsetX,
                shadowOffsetY: data.shadowOffsetY,
                parallaxDepth: data.parallaxDepth
            )
        }
        
        NativeMotionService.shared.onIntentDetected = { [weak self] intent in
            guard let self = self else { return }
            switch intent.type {
            case .shakeToDraw:
                self.handleShakeDetected()
            case .tiltLeft:
                self.bridge?.sendEventToWeb(event: "onMotionIntent", payload: ["type": "tiltLeft"])
            case .tiltRight:
                self.bridge?.sendEventToWeb(event: "onMotionIntent", payload: ["type": "tiltRight"])
            case .flickComplete:
                self.bridge?.sendEventToWeb(event: "onMotionIntent", payload: ["type": "flickComplete"])
            case .faceDown:
                self.bridge?.sendEventToWeb(event: "onMotionIntent", payload: ["type": "faceDown"])
            case .faceUp:
                self.bridge?.sendEventToWeb(event: "onMotionIntent", payload: ["type": "faceUp"])
            case .none:
                break
            }
        }
    }
    
    /// Start listening to 60Hz gyroscope and accelerometer
    public func startUpdates() {
        NativeMotionService.shared.startUpdates()
    }
    
    /// Stop updates when app is in background or Low Power Mode to conserve battery
    public func stopUpdates() {
        NativeMotionService.shared.stopUpdates()
    }
    
    public func handleShakeDetected() {
        print("🎲 [NativeMotionManager] Device shake detected! Triggering Shake-to-Draw")
        NativeSoundAndHaptics.shared.playCardShuffle()
        bridge?.sendShakeToDraw()
    }
}
