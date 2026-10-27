import Foundation
import Speech
import AVFoundation

/// Native iOS Speech Recognition Manager for Minest AI Voice Companion
/// Handles on-device / Apple cloud real-time speech-to-text, bridging directly to WKWebView.
public final class NativeSpeechRecognitionManager: NSObject {
    public static let shared = NativeSpeechRecognitionManager()
    
    public weak var bridge: MinestBridge?
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var isRecording = false
    private var lastRecognizedText = ""
    
    private override init() {
        super.init()
        self.speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))
    }
    
    public func startRecognition() {
        if isRecording {
            stopRecognition()
        }
        
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                guard let self = self else { return }
                switch authStatus {
                case .authorized:
                    self.startAudioEngineAndRecognition()
                case .denied, .restricted, .notDetermined:
                    print("⚠️ [NativeSpeechRecognition] Speech recognition not authorized: \(authStatus)")
                    self.bridge?.sendEventToWeb(event: "minestSpeechError", payload: [
                        "error": "speech_not_authorized",
                        "status": authStatus.rawValue
                    ])
                @unknown default:
                    break
                }
            }
        }
    }
    
    private func startAudioEngineAndRecognition() {
        // Reset any existing task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])   // 44.4: same mode as native TTS (switching modes clicked)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            print("⚠️ [NativeSpeechRecognition] AVAudioSession setup error: \(error)")
        }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            print("⚠️ [NativeSpeechRecognition] Unable to create SFSpeechAudioBufferRecognitionRequest")
            return
        }
        
        recognitionRequest.shouldReportPartialResults = true
        if #available(iOS 13.0, *) {
            recognitionRequest.requiresOnDeviceRecognition = false
        }
        
        if speechRecognizer == nil {
            speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))
        }
        
        lastRecognizedText = ""
        let inputNode = audioEngine.inputNode
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                let text = result.bestTranscription.formattedString
                let isFinal = result.isFinal
                self.lastRecognizedText = text
                
                DispatchQueue.main.async {
                    self.bridge?.sendEventToWeb(event: "minestSpeechResult", payload: [
                        "text": text,
                        "isFinal": isFinal
                    ])
                }
            }
            
            if let error = error {
                let nsError = error as NSError
                // Domain=kAFAssistantErrorDomain Code=203 "Timeout" is normal on silence
                if nsError.code != 203 && nsError.code != 1110 {
                    print("ℹ️ [NativeSpeechRecognition] Task note: \(error.localizedDescription)")
                }
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        do {
            try audioEngine.start()
            isRecording = true
            bridge?.sendEventToWeb(event: "minestSpeechStarted", payload: [:])
            print("🎙️ [NativeSpeechRecognition] Native iOS Speech recognition engine started successfully")
        } catch {
            print("⚠️ [NativeSpeechRecognition] Audio engine start failed: \(error)")
            bridge?.sendEventToWeb(event: "minestSpeechError", payload: ["error": error.localizedDescription])
        }
    }
    
    public func stopRecognition() {
        guard isRecording else { return }
        isRecording = false
        
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        
        bridge?.sendEventToWeb(event: "minestSpeechStopped", payload: ["lastText": lastRecognizedText])
        print("🛑 [NativeSpeechRecognition] Native iOS Speech recognition stopped")
    }
}
