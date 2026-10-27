import Foundation
import ARKit
import WebKit

/// Native ARKit Face Tracking Manager for Octopus Copy Cat / Talking Tom Mode
/// Handles TrueDepth camera capture, ARFaceAnchor normalization, and streaming to WebKit.
public final class NativeARFaceTrackingManager: NSObject, ARSessionDelegate {
    public static let shared = NativeARFaceTrackingManager()
    
    public weak var bridge: MinestBridge?
    private var session: ARSession?
    private var isTracking = false
    private var lastFrameTime: TimeInterval = 0
    private let targetFrameInterval: TimeInterval = 1.0 / 60.0 // 60 FPS
    
    private override init() {
        super.init()
    }
    
    /// Check if device hardware supports TrueDepth / ARFaceTracking
    public var isSupported: Bool {
        return ARFaceTrackingConfiguration.isSupported
    }
    
    /// Explicitly start camera face tracking session
    public func startTracking() {
        guard isSupported else {
            print("⚠️ [NativeARFaceTracker] ARFaceTrackingConfiguration is not supported on this device.")
            bridge?.sendEventToWeb(event: "__onARKitTrackingError", payload: ["error": "ARFaceTrackingNotSupported"])
            return
        }
        
        guard !isTracking else { return }
        
        if session == nil {
            session = ARSession()
            session?.delegate = self
        }
        
        let configuration = ARFaceTrackingConfiguration()
        configuration.isLightEstimationEnabled = true
        if #available(iOS 13.0, *) {
            configuration.maximumNumberOfTrackedFaces = 1
        }
        
        session?.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        isTracking = true
        print("🐙 [NativeARFaceTracker] Camera and ARFaceTracking session started.")
    }
    
    /// Explicitly stop camera tracking and release all video capture resources
    public func stopTracking() {
        guard isTracking else { return }
        
        session?.pause()
        session = nil
        isTracking = false
        print("🐙 [NativeARFaceTracker] Camera and ARFaceTracking session paused & resources released.")
    }
    
    // MARK: - ARSessionDelegate
    
    public func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        guard isTracking else { return }
        
        let currentTime = CACurrentMediaTime()
        guard currentTime - lastFrameTime >= targetFrameInterval else { return }
        lastFrameTime = currentTime
        
        guard let faceAnchor = anchors.compactMap({ $0 as? ARFaceAnchor }).first else { return }
        guard faceAnchor.isTracked else { return }
        
        // 1. Extract BlendShapes
        let shapes = faceAnchor.blendShapes
        var payload: [String: Any] = [:]
        
        payload["eyeBlinkLeft"] = shapes[.eyeBlinkLeft]?.floatValue ?? 0
        payload["eyeBlinkRight"] = shapes[.eyeBlinkRight]?.floatValue ?? 0
        payload["eyeWideLeft"] = shapes[.eyeWideLeft]?.floatValue ?? 0
        payload["eyeWideRight"] = shapes[.eyeWideRight]?.floatValue ?? 0
        payload["eyeLookDownLeft"] = shapes[.eyeLookDownLeft]?.floatValue ?? 0
        payload["eyeLookDownRight"] = shapes[.eyeLookDownRight]?.floatValue ?? 0
        payload["eyeLookInLeft"] = shapes[.eyeLookInLeft]?.floatValue ?? 0
        payload["eyeLookInRight"] = shapes[.eyeLookInRight]?.floatValue ?? 0
        payload["eyeLookOutLeft"] = shapes[.eyeLookOutLeft]?.floatValue ?? 0
        payload["eyeLookOutRight"] = shapes[.eyeLookOutRight]?.floatValue ?? 0
        payload["eyeLookUpLeft"] = shapes[.eyeLookUpLeft]?.floatValue ?? 0
        payload["eyeLookUpRight"] = shapes[.eyeLookUpRight]?.floatValue ?? 0
        
        payload["jawOpen"] = shapes[.jawOpen]?.floatValue ?? 0
        payload["mouthSmileLeft"] = shapes[.mouthSmileLeft]?.floatValue ?? 0
        payload["mouthSmileRight"] = shapes[.mouthSmileRight]?.floatValue ?? 0
        payload["mouthFrownLeft"] = shapes[.mouthFrownLeft]?.floatValue ?? 0
        payload["mouthFrownRight"] = shapes[.mouthFrownRight]?.floatValue ?? 0
        payload["mouthPucker"] = shapes[.mouthPucker]?.floatValue ?? 0
        
        payload["browInnerUp"] = shapes[.browInnerUp]?.floatValue ?? 0
        payload["browDownLeft"] = shapes[.browDownLeft]?.floatValue ?? 0
        payload["browDownRight"] = shapes[.browDownRight]?.floatValue ?? 0
        
        // 2. Extract Head Pose (Euler angles in radians from transform matrix)
        let transform = faceAnchor.transform
        let pitch = asin(-transform.columns.2.y)
        let yaw = atan2(transform.columns.2.x, transform.columns.2.z)
        let roll = atan2(transform.columns.0.y, transform.columns.1.y)
        
        payload["headPitch"] = pitch
        payload["headYaw"] = yaw
        payload["headRoll"] = roll
        payload["confidence"] = 1.0
        
        // 3. Dispatch to WebKit via bridge
        DispatchQueue.main.async { [weak self] in
            self?.bridge?.dispatchARKitFaceFrame(payload)
        }
    }
    
    public func session(_ session: ARSession, didFailWithError error: Error) {
        print("❌ [NativeARFaceTracker] ARSession failed with error: \(error.localizedDescription)")
        bridge?.sendEventToWeb(event: "__onARKitTrackingError", payload: ["error": error.localizedDescription])
    }
    
    public func sessionWasInterrupted(_ session: ARSession) {
        print("⚠️ [NativeARFaceTracker] ARSession interrupted (e.g. backgrounded).")
    }
    
    public func sessionInterruptionEnded(_ session: ARSession) {
        print("🔄 [NativeARFaceTracker] ARSession interruption ended.")
    }
}
