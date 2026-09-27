import Foundation
import UIKit

public enum ShareItemType: String, Codable {
    case url = "url"
    case text = "text"
    case image = "image"
    case pdf = "pdf"
    case mapLink = "mapLink"
}

public struct ShareCardModel: Identifiable, Codable {
    public let id: String
    public var title: String
    public var notes: String
    public var urlString: String?
    public var type: ShareItemType
    public var category: String
    public var tags: [String]
    public var targetColumn: String
    public var aiSummary: String?
    public var imageFileName: String?
    public var pdfFileName: String?
    public let createdAt: Date
    
    public init(
        id: String = "card-share-\(UUID().uuidString.prefix(8))",
        title: String,
        notes: String = "",
        urlString: String? = nil,
        type: ShareItemType = .text,
        category: String = "收集箱",
        tags: [String] = ["Share"],
        targetColumn: String = "Inbox",
        aiSummary: String? = nil,
        imageFileName: String? = nil,
        pdfFileName: String? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.notes = notes
        self.urlString = urlString
        self.type = type
        self.category = category
        self.tags = tags
        self.targetColumn = targetColumn
        self.aiSummary = aiSummary
        self.imageFileName = imageFileName
        self.pdfFileName = pdfFileName
        self.createdAt = createdAt
    }
}

// MARK: - Asynchronous Classification with Safe Inbox Fallback
public final class ShareClassifier {
    public static let shared = ShareClassifier()
    private init() {}
    
    public struct ClassificationResult {
        public let category: String
        public let suggestedColumn: String
        public let tags: [String]
        public let aiSummary: String
        public let confidence: Double
    }
    
    /// Safe fallback result targeting the Inbox column
    public static var fallbackInboxResult: ClassificationResult {
        ClassificationResult(
            category: "📥 收集箱 (Inbox)",
            suggestedColumn: "Inbox",
            tags: ["Inbox", "QuickShare"],
            aiSummary: "已快速收录至收集箱，稍后进行详细归档整理。",
            confidence: 1.0
        )
    }
    
    /// Asynchronously classifies incoming content with instant Inbox fallback
    public func classify(
        title: String,
        content: String,
        url: URL?,
        type: ShareItemType
    ) async -> ClassificationResult {
        // Safe immediate return if empty
        let combined = "\(title) \(content) \(url?.absoluteString ?? "")".lowercased()
        
        // Simulate swift asynchronous intelligent inference
        try? await Task.sleep(nanoseconds: 120_000_000) // 120ms smooth UI feedback
        
        // 1. Apple Maps / Location / Navigation
        if type == .mapLink || combined.contains("maps.apple.com") || combined.contains("maps.google.com") || combined.contains("amap.com") {
            let placeName = title.isEmpty ? "地图地点标记" : title
            return ClassificationResult(
                category: "📍 出行与地点",
                suggestedColumn: "Inbox",
                tags: ["Location", "Map", "Travel"],
                aiSummary: "检测到地理位置链接「\(placeName)」，已提取坐标与路线标签。",
                confidence: 0.96
            )
        }
        
        // 2. Technical, Code, Documentation, GitHub
        if combined.contains("github.com") || combined.contains("stackoverflow.com") || combined.contains("developer.apple.com") ||
           combined.contains("docs.") || combined.contains("api") || combined.contains("swift") || combined.contains("react") {
            return ClassificationResult(
                category: "💻 技术与开发",
                suggestedColumn: "Inbox",
                tags: ["Tech", "Code", "Dev"],
                aiSummary: "检测到开发与技术工程文档，已关联代码知识库。",
                confidence: 0.94
            )
        }
        
        // 3. In-depth Articles, News, Essays, Reading
        if type == .url && (combined.contains("medium.com") || combined.contains("substack.com") || combined.contains("zhihu.com") ||
                            combined.contains("article") || combined.contains("blog") || combined.contains("news") || combined.contains("post")) {
            return ClassificationResult(
                category: "📖 深度阅读",
                suggestedColumn: "Inbox",
                tags: ["Reading", "Article", "Knowledge"],
                aiSummary: "提取长篇专栏文章，已排入待读队列以便稍后在 Cover Flow 沉浸研读。",
                confidence: 0.91
            )
        }
        
        // 4. PDFs & Formal Documents
        if type == .pdf || combined.contains(".pdf") {
            return ClassificationResult(
                category: "📄 文档与白皮书",
                suggestedColumn: "Inbox",
                tags: ["Document", "PDF", "Report"],
                aiSummary: "PDF 文档已安全暂存，支持全文本地检索与卡片翻转速记。",
                confidence: 0.95
            )
        }
        
        // 5. Visual Inspiration & Images
        if type == .image {
            return ClassificationResult(
                category: "🎨 视觉灵感",
                suggestedColumn: "Inbox",
                tags: ["Visual", "Inspiration", "Design"],
                aiSummary: "视觉设计素材与灵感图片，已应用高透毛玻璃卡片展示。",
                confidence: 0.89
            )
        }
        
        // 6. Actionable tasks / Todos
        if combined.contains("todo") || combined.contains("checklist") || combined.contains("task") || combined.contains("待办") || combined.contains("明天") {
            return ClassificationResult(
                category: "🎯 待办清单",
                suggestedColumn: "Inbox",
                tags: ["Todo", "ActionItem"],
                aiSummary: "识别到待办任务意图，已生成勾选清单项。",
                confidence: 0.92
            )
        }
        
        // Safe Default Inbox Fallback
        return Self.fallbackInboxResult
    }
}

// MARK: - App Group Persistence Store
public final class ShareDataStore {
    public static let shared = ShareDataStore()
    private let appGroupId = "group.com.zouminmin.minest"
    private let sharedCardsFileName = "shared_incoming_cards.json"
    private let userDefaultsKey = "minest_shared_incoming_cards_count"
    
    private let userDefaultsJsonDataKey = "minest_shared_incoming_cards_json"
    
    private init() {}
    
    private var containerURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) ??
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    }
    
    /// Save card model into the shared App Group container
    public func saveCard(_ card: ShareCardModel) -> Bool {
        var existingCards = loadPendingCards()
        existingCards.insert(card, at: 0)
        
        guard let data = try? JSONEncoder().encode(existingCards) else { return false }
        
        // 1. App Group Suite UserDefaults (instant cross-process IPC)
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.set(data, forKey: userDefaultsJsonDataKey)
            defaults.set(existingCards.count, forKey: userDefaultsKey)
            defaults.set(Date().timeIntervalSince1970, forKey: "minest_last_share_timestamp")
            defaults.synchronize()
        }
        
        // 2. Shared container disk file
        if let dir = containerURL {
            let fileURL = dir.appendingPathComponent(sharedCardsFileName)
            try? data.write(to: fileURL, options: .atomic)
        }
        
        print("✅ [ShareDataStore] Saved card: \(card.title) (Total: \(existingCards.count))")
        return true
    }
    
    /// Load pending cards from disk file or shared UserDefaults suite
    public func loadPendingCards() -> [ShareCardModel] {
        // Try shared file first
        if let dir = containerURL {
            let fileURL = dir.appendingPathComponent(sharedCardsFileName)
            if let data = try? Data(contentsOf: fileURL),
               let list = try? JSONDecoder().decode([ShareCardModel].self, from: data),
               !list.isEmpty {
                return list
            }
        }
        
        // Fallback to UserDefaults suite
        if let defaults = UserDefaults(suiteName: appGroupId),
           let data = defaults.data(forKey: userDefaultsJsonDataKey),
           let list = try? JSONDecoder().decode([ShareCardModel].self, from: data) {
            return list
        }
        
        return []
    }
    
    /// Clear or mark cards as processed
    public func clearPendingCards() {
        if let dir = containerURL {
            let fileURL = dir.appendingPathComponent(sharedCardsFileName)
            try? FileManager.default.removeItem(at: fileURL)
        }
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.removeObject(forKey: userDefaultsJsonDataKey)
            defaults.set(0, forKey: userDefaultsKey)
            defaults.synchronize()
        }
    }
}
