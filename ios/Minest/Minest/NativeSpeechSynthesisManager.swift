import Foundation
import AVFoundation

/// 44.4: native text-to-speech for the voice orb. WKWebView's speechSynthesis plays through the web
/// content process, which the ring/silent switch (and the voice-chat audio mode used by dictation) can
/// silence; AVSpeechSynthesizer plays through the app's own audio session on the speaker.
/// Events back to the page: minestTTSStart / minestTTSBoundary / minestTTSEnd, each with the caller's id.
public final class NativeSpeechSynthesisManager: NSObject, AVSpeechSynthesizerDelegate {
    public static let shared = NativeSpeechSynthesisManager()
    public weak var bridge: MinestBridge?

    private let synthesizer = AVSpeechSynthesizer()
    private var ids: [ObjectIdentifier: String] = [:]

    private override init() {
        super.init()
        synthesizer.delegate = self
    }

    public func speak(text: String, lang: String, rate: Double, id: String) {
        // Configure the audio session only when it isn't already right: re-applying it for every sentence
        // reset the audio route each time and was heard as clicks / stutter between sentences.
        let session = AVAudioSession.sharedInstance()
        if session.category != .playAndRecord || session.mode != .default || !session.categoryOptions.contains(.defaultToSpeaker) {
            do {
                try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
                try session.setActive(true)
            } catch {
                print("⚠️ [NativeTTS] audio session: \(error)")
            }
        }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = Self.bestVoice(for: lang)
        let base = Double(AVSpeechUtteranceDefaultSpeechRate)
        utterance.rate = Float(min(Double(AVSpeechUtteranceMaximumSpeechRate), max(Double(AVSpeechUtteranceMinimumSpeechRate), base * rate)))
        utterance.pitchMultiplier = 1.04
        utterance.preUtteranceDelay = 0
        utterance.postUtteranceDelay = 0
        ids[ObjectIdentifier(utterance)] = id
        synthesizer.speak(utterance)
    }

    public func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    private static func bestVoice(for lang: String) -> AVSpeechSynthesisVoice? {
        let prefix = String(lang.lowercased().prefix(2))
        let voices = AVSpeechSynthesisVoice.speechVoices().filter { $0.language.lowercased().hasPrefix(prefix) }
        let exact = voices.filter { $0.language.lowercased() == lang.lowercased() }
        let pool = exact.isEmpty ? voices : exact
        if let premium = pool.first(where: { $0.quality == .premium }) { return premium }
        if let enhanced = pool.first(where: { $0.quality == .enhanced }) { return enhanced }
        return pool.first ?? AVSpeechSynthesisVoice(language: lang)
    }

    private func send(_ event: String, _ utterance: AVSpeechUtterance, _ extra: [String: Any] = [:]) {
        guard let id = ids[ObjectIdentifier(utterance)] else { return }
        var payload: [String: Any] = ["id": id]
        extra.forEach { payload[$0.key] = $0.value }
        DispatchQueue.main.async { self.bridge?.sendEventToWeb(event: event, payload: payload) }
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        send("minestTTSStart", utterance)
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, willSpeakRangeOfSpeechString characterRange: NSRange, utterance: AVSpeechUtterance) {
        send("minestTTSBoundary", utterance, ["charIndex": characterRange.location, "charLength": characterRange.length])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        send("minestTTSEnd", utterance)
        ids.removeValue(forKey: ObjectIdentifier(utterance))
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        send("minestTTSEnd", utterance, ["canceled": true])
        ids.removeValue(forKey: ObjectIdentifier(utterance))
    }
}
