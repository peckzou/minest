import UIKit
import SwiftUI
import UniformTypeIdentifiers

@objc(ShareViewController)
public class ShareViewController: UIViewController {
    
    private var extractedTitle: String = ""
    private var extractedNotes: String = ""
    private var extractedURL: URL? = nil
    private var extractedImage: UIImage? = nil
    private var extractedPDFName: String? = nil
    private var extractedType: ShareItemType = .text
    
    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 14/255, green: 18/255, blue: 24/255, alpha: 1.0)
        
        extractIncomingShareData { [weak self] in
            DispatchQueue.main.async {
                self?.presentSwiftUIShareView()
            }
        }
    }
    
    private func presentSwiftUIShareView() {
        let rootView = ShareView(
            title: extractedTitle.isEmpty ? (extractedURL?.host ?? "新收录内容") : extractedTitle,
            notes: extractedNotes,
            url: extractedURL,
            type: extractedType,
            image: extractedImage,
            pdfFileName: extractedPDFName,
            onCancel: { [weak self] in
                self?.extensionContext?.cancelRequest(withError: NSError(domain: "com.zouminmin.minest.share", code: 0, userInfo: nil))
            },
            onSave: { [weak self] card in
                _ = ShareDataStore.shared.saveCard(card)
                self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        )
        
        let hostingController = UIHostingController(rootView: rootView)
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        hostingController.didMove(toParent: self)
    }
    
    // MARK: - Incoming Data Extraction
    private func extractIncomingShareData(completion: @escaping () -> Void) {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem], !items.isEmpty else {
            completion()
            return
        }
        
        let group = DispatchGroup()
        
        for item in items {
            if let text = item.attributedContentText?.string, !text.isEmpty {
                if extractedTitle.isEmpty { extractedTitle = text }
                else { extractedNotes += "\n" + text }
            }
            
            guard let attachments = item.attachments else { continue }
            
            for provider in attachments {
                // 1. URL / Map Link
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    group.enter()
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
                        defer { group.leave() }
                        guard let self = self else { return }
                        if let url = item as? URL {
                            self.extractedURL = url
                            if url.host?.contains("maps.apple.com") == true || url.host?.contains("maps.google.com") == true {
                                self.extractedType = .mapLink
                                if self.extractedTitle.isEmpty { self.extractedTitle = "已标记地图地点" }
                            } else {
                                self.extractedType = .url
                                if self.extractedTitle.isEmpty {
                                    self.extractedTitle = url.lastPathComponent.isEmpty ? (url.host ?? "网页链接") : url.lastPathComponent
                                }
                            }
                        }
                    }
                }
                
                // 2. Plain Text
                else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    group.enter()
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, _ in
                        defer { group.leave() }
                        guard let self = self else { return }
                        if let text = item as? String {
                            if self.extractedTitle.isEmpty {
                                self.extractedTitle = text
                            } else {
                                self.extractedNotes += (self.extractedNotes.isEmpty ? "" : "\n") + text
                            }
                        }
                    }
                }
                
                // 3. Image
                else if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    group.enter()
                    provider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, _ in
                        defer { group.leave() }
                        guard let self = self else { return }
                        self.extractedType = .image
                        if let image = item as? UIImage {
                            self.extractedImage = image
                        } else if let url = item as? URL, let data = try? Data(contentsOf: url), let img = UIImage(data: data) {
                            self.extractedImage = img
                            if self.extractedTitle.isEmpty { self.extractedTitle = url.lastPathComponent }
                        }
                    }
                }
                
                // 4. PDF Document
                else if provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) {
                    group.enter()
                    provider.loadItem(forTypeIdentifier: UTType.pdf.identifier, options: nil) { [weak self] item, _ in
                        defer { group.leave() }
                        guard let self = self else { return }
                        self.extractedType = .pdf
                        if let url = item as? URL {
                            self.extractedPDFName = url.lastPathComponent
                            if self.extractedTitle.isEmpty { self.extractedTitle = url.deletingPathExtension().lastPathComponent }
                        }
                    }
                }
            }
        }
        
        group.notify(queue: .main) {
            completion()
        }
    }
}
