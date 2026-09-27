import UIKit
import AudioToolbox

/// High-performance audio-haptic feedback engine providing synchronized tactile and auditory response
public final class NativeSoundAndHaptics {
    public static let shared = NativeSoundAndHaptics()
    
    // Configurable toggles
    public var isHapticEnabled: Bool = true
    public var isAudioEnabled: Bool = true
    
    // Pre-warmed feedback generators for sub-millisecond response
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let softImpact = UIImpactFeedbackGenerator(style: .soft)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
    private let selectionFeedback = UISelectionFeedbackGenerator()
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    // System Sound IDs
    public enum SoundType {
        case tick          // Crisp mechanical checklist tick (1104)
        case pop           // Modal / popover appear (1052)
        case complete      // Tink / task completion chime (1057)
        case celebrate     // Milestone / fanfare chime (1025)
        case delete        // Trash / remove sound (1055)
        case warning       // Alert tone (1073)
        case none
        
        var systemSoundID: SystemSoundID? {
            switch self {
            case .tick:      return 1104
            case .pop:       return 1052
            case .complete:  return 1057
            case .celebrate: return 1025
            case .delete:    return 1055
            case .warning:   return 1073
            case .none:      return nil
            }
        }
    }
    
    private init() {
        prepareAll()
    }
    
    /// Pre-warm all Taptic generators to eliminate any tactile lag
    public func prepareAll() {
        DispatchQueue.main.async { [weak self] in
            self?.lightImpact.prepare()
            self?.mediumImpact.prepare()
            self?.selectionFeedback.prepare()
            self?.notificationFeedback.prepare()
        }
    }
    
    // MARK: - Combined Feedback API
    
    /// Trigger checklist item toggled (light tactile tick + mechanical tick sound)
    public func playChecklistTick(isDone: Bool) {
        if isHapticEnabled {
            if isDone {
                mediumImpact.impactOccurred(intensity: 0.85)
            } else {
                lightImpact.impactOccurred(intensity: 0.6)
            }
            lightImpact.prepare()
        }
        if isAudioEnabled {
            playSound(.tick)
        }
    }
    
    /// Trigger card or milestone completion (success vibration + chime)
    public func playCelebration() {
        if isHapticEnabled {
            notificationFeedback.notificationOccurred(.success)
            notificationFeedback.prepare()
        }
        if isAudioEnabled {
            playSound(.celebrate)
        }
    }
    
    // MARK: - Card Gameplay Audio-Haptics
    
    /// Tactile snap when flipping a 3D flashcard
    public func playCardFlip() {
        if isHapticEnabled {
            mediumImpact.impactOccurred(intensity: 0.82)
            mediumImpact.prepare()
        }
        if isAudioEnabled {
            playSound(.tick)
        }
    }
    
    /// Subtle click when swiping/thumbing through the card deck
    public func playCardSwipe() {
        if isHapticEnabled {
            selectionFeedback.selectionChanged()
            selectionFeedback.prepare()
        }
    }
    
    /// Rapid micro-haptics mimicking riffling a physical deck of cards (Shake to Draw)
    public func playCardShuffle() {
        guard isHapticEnabled else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.lightImpact.impactOccurred(intensity: 0.5)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.04) {
                self.selectionFeedback.selectionChanged()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.09) {
                self.lightImpact.impactOccurred(intensity: 0.7)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.14) {
                self.mediumImpact.impactOccurred(intensity: 0.9)
                if self.isAudioEnabled {
                    self.playSound(.pop)
                }
            }
        }
    }
    
    /// Progressive mastery rating (1 = reset/struggled, 2 = review, 3..5 = mastery up)
    public func playMasteryRate(level: Int) {
        if isHapticEnabled {
            switch level {
            case 1:
                notificationFeedback.notificationOccurred(.warning)
                notificationFeedback.prepare()
            case 2:
                softImpact.impactOccurred(intensity: 0.8)
                softImpact.prepare()
            case 3, 4:
                mediumImpact.impactOccurred(intensity: 0.85)
                mediumImpact.prepare()
            case 5:
                playCelebration()
                return
            default:
                mediumImpact.impactOccurred()
            }
        }
        if isAudioEnabled {
            playSound(level >= 3 ? .complete : .tick)
        }
    }
    
    /// Shatter/glass break tactile impact
    public func playCardShatter() {
        if isHapticEnabled {
            rigidImpact.impactOccurred(intensity: 1.0)
            notificationFeedback.notificationOccurred(.error)
        }
        if isAudioEnabled {
            playSound(.warning)
        }
    }
    
    /// Trigger generic haptic style with optional paired sound
    public func trigger(style: String, sound: SoundType = .none) {
        if isHapticEnabled {
            switch style.lowercased() {
            case "light":
                lightImpact.impactOccurred()
                lightImpact.prepare()
            case "medium":
                mediumImpact.impactOccurred()
                mediumImpact.prepare()
            case "heavy":
                heavyImpact.impactOccurred()
                heavyImpact.prepare()
            case "soft":
                softImpact.impactOccurred()
                softImpact.prepare()
            case "rigid":
                rigidImpact.impactOccurred()
                rigidImpact.prepare()
            case "selection":
                selectionFeedback.selectionChanged()
                selectionFeedback.prepare()
            case "success":
                notificationFeedback.notificationOccurred(.success)
                notificationFeedback.prepare()
            case "warning":
                notificationFeedback.notificationOccurred(.warning)
                notificationFeedback.prepare()
            case "error":
                notificationFeedback.notificationOccurred(.error)
                notificationFeedback.prepare()
            default:
                mediumImpact.impactOccurred()
            }
        }
        
        if isAudioEnabled && sound != .none {
            playSound(sound)
        }
    }
    
    private func playSound(_ sound: SoundType) {
        guard let soundID = sound.systemSoundID else { return }
        AudioServicesPlaySystemSound(soundID)
    }
}
