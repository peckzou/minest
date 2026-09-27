import Foundation
import UIKit
import UniformTypeIdentifiers

/// Manages native file export/import, iOS Share Sheet, and Documents directory persistence
@MainActor
public final class NativeDocumentManager: NSObject, UIDocumentPickerDelegate {
    public static let shared = NativeDocumentManager()
    
    private var activeImportCompletion: ((String?) -> Void)?
    
    private override init() {
        super.init()
    }
    
    // MARK: - Documents Persistence
    
    private var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    /// Saves text/JSON data directly to Documents directory
    public func saveToDocuments(data: String, filename: String = "minest_boards_backup.json") -> Bool {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: fileURL, atomically: true, encoding: .utf8)
            print("💾 [DocumentManager] Saved \(data.count) bytes to \(fileURL.lastPathComponent)")
            return true
        } catch {
            print("❌ [DocumentManager] Failed to write file: \(error.localizedDescription)")
            return false
        }
    }
    
    /// Reads text/JSON data from Documents directory
    public func readFromDocuments(filename: String = "minest_boards_backup.json") -> String? {
        let fileURL = documentsDirectory.appendingPathComponent(filename)
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        do {
            let content = try String(contentsOf: fileURL, encoding: .utf8)
            print("📖 [DocumentManager] Read \(content.count) bytes from \(fileURL.lastPathComponent)")
            return content
        } catch {
            print("❌ [DocumentManager] Failed to read file: \(error.localizedDescription)")
            return nil
        }
    }
    
    // MARK: - Share Sheet & Export
    
    /// Presents native iOS Share Sheet with text, URL, or JSON data file
    public func share(
        text: String? = nil,
        url: URL? = nil,
        jsonData: String? = nil,
        filename: String = "MinestBoard.json"
    ) {
        var items: [Any] = []
        if let text = text, !text.isEmpty {
            items.append(text)
        }
        if let url = url {
            items.append(url)
        }
        if let jsonData = jsonData, let data = jsonData.data(using: .utf8) {
            let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
            try? data.write(to: tempURL)
            items.append(tempURL)
        }
        
        guard !items.isEmpty, let topVC = getTopViewController() else { return }
        
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = topVC.view
            popover.sourceRect = CGRect(x: topVC.view.bounds.midX, y: topVC.view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        topVC.present(activityVC, animated: true)
    }
    
    // MARK: - Document Picker (Import)
    
    /// Presents native file picker to import a JSON board file
    public func presentDocumentPicker(completion: @escaping (String?) -> Void) {
        guard let topVC = getTopViewController() else {
            completion(nil)
            return
        }
        
        self.activeImportCompletion = completion
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.json, .text], asCopy: true)
        picker.delegate = self
        picker.allowsMultipleSelection = false
        topVC.present(picker, animated: true)
    }
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else {
            activeImportCompletion?(nil)
            activeImportCompletion = nil
            return
        }
        
        do {
            let content = try String(contentsOf: url, encoding: .utf8)
            print("📥 [DocumentManager] Imported file (\(content.count) chars) from \(url.lastPathComponent)")
            activeImportCompletion?(content)
        } catch {
            print("❌ [DocumentManager] Import error: \(error.localizedDescription)")
            activeImportCompletion?(nil)
        }
        activeImportCompletion = nil
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        activeImportCompletion?(nil)
        activeImportCompletion = nil
    }
    
    // MARK: - Memory Monitoring
    
    /// Returns current resident process memory in Megabytes
    public static func getProcessMemoryMB() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        if kerr == KERN_SUCCESS {
            return Double(info.resident_size) / (1024.0 * 1024.0)
        }
        return 0.0
    }
    
    private func getTopViewController() -> UIViewController? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }),
              var topVC = window.rootViewController else {
            return nil
        }
        while let presented = topVC.presentedViewController {
            topVC = presented
        }
        return topVC
    }
}
