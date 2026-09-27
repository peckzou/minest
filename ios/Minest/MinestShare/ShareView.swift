import SwiftUI

public struct ShareView: View {
    @State public var title: String
    @State public var notes: String
    public let url: URL?
    public let type: ShareItemType
    public let image: UIImage?
    public let pdfFileName: String?
    
    @State private var selectedColumn: String = "📥 收集箱 (Inbox)"
    @State private var categoryText: String = "正在智能分类..."
    @State private var aiSummaryText: String = "正在分析内容要点..."
    @State private var tags: [String] = ["Share"]
    @State private var isClassifying: Bool = true
    @State private var isSaved: Bool = false
    
    public var onCancel: () -> Void
    public var onSave: (ShareCardModel) -> Void
    
    public init(
        title: String,
        notes: String = "",
        url: URL? = nil,
        type: ShareItemType = .text,
        image: UIImage? = nil,
        pdfFileName: String? = nil,
        onCancel: @escaping () -> Void,
        onSave: @escaping (ShareCardModel) -> Void
    ) {
        self._title = State(initialValue: title)
        self._notes = State(initialValue: notes)
        self.url = url
        self.type = type
        self.image = image
        self.pdfFileName = pdfFileName
        self.onCancel = onCancel
        self.onSave = onSave
    }
    
    private let availableColumns = [
        "📥 收集箱 (Inbox)",
        "📖 深度阅读",
        "🎯 待办清单",
        "💡 灵感备忘"
    ]
    
    public var body: some View {
        NavigationStack {
            ZStack {
                // Background dark frosted canvas
                Color(red: 14/255, green: 18/255, blue: 24/255)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 16) {
                        // 1. Live Preview Glass Card
                        previewGlassCard
                        
                        // 2. AI Classification & Safe Inbox Fallback Capsule
                        aiClassificationCapsule
                        
                        // 3. Destination Column Picker
                        destinationPickerCard
                        
                        // 4. Content Edit Section
                        editFieldsCard
                        
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                }
            }
            .navigationTitle("添加至 Minest")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        onCancel()
                    }
                    .foregroundColor(.white.opacity(0.8))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: handleSave) {
                        HStack(spacing: 4) {
                            if isSaved {
                                Image(systemName: "checkmark")
                                Text("已添加")
                            } else {
                                Text("添加")
                                    .fontWeight(.semibold)
                            }
                        }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .tint(Color(red: 48/255, green: 209/255, blue: 88/255))
                }
            }
        }
        .task {
            await runClassification()
        }
    }
    
    // MARK: - Components
    
    @ViewBuilder
    private var previewGlassCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                // Type Icon Badge
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: iconNameForType)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(Color(red: 48/255, green: 209/255, blue: 88/255))
                }
                
                VStack(alignment: .leading, spacing: 3) {
                    Text(title.isEmpty ? "未命名卡片" : title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    if let host = url?.host {
                        Text(host)
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.5))
                    } else if let pdf = pdfFileName {
                        Text("PDF 文档: \(pdf)")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.5))
                    } else {
                        Text(type.rawValue.uppercased())
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white.opacity(0.4))
                    }
                }
                Spacer()
            }
            
            // Image Preview if available
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(maxHeight: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
    }
    
    @ViewBuilder
    private var aiClassificationCapsule: some View {
        HStack(spacing: 8) {
            Image(systemName: "sparkles")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(red: 100/255, green: 210/255, blue: 255/255))
            
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("智能分类建议:")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                    
                    Text(categoryText)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(red: 100/255, green: 210/255, blue: 255/255))
                }
                
                Text(aiSummaryText)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(2)
            }
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.blue.opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.blue.opacity(0.25), lineWidth: 1)
                )
        )
    }
    
    @ViewBuilder
    private var destinationPickerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("目标列表")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white.opacity(0.6))
                .padding(.horizontal, 2)
            
            Picker("目标列表", selection: $selectedColumn) {
                ForEach(availableColumns, id: \.self) { col in
                    Text(col).tag(col)
                }
            }
            .pickerStyle(.segmented)
            .colorMultiply(Color(red: 48/255, green: 209/255, blue: 88/255))
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    @ViewBuilder
    private var editFieldsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text("标题")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.6))
                
                TextField("卡片标题", text: $title)
                    .font(.system(size: 15))
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("备注与心得")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.6))
                
                TextField("添加随手记录或要点摘要...", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    private var iconNameForType: String {
        switch type {
        case .url: return "safari"
        case .text: return "note.text"
        case .image: return "photo.on.rectangle.angled"
        case .pdf: return "doc.richtext"
        case .mapLink: return "map"
        }
    }
    
    private func runClassification() async {
        let result = await ShareClassifier.shared.classify(
            title: title,
            content: notes,
            url: url,
            type: type
        )
        withAnimation(.easeInOut(duration: 0.25)) {
            self.categoryText = result.category
            self.aiSummaryText = result.aiSummary
            self.tags = result.tags
            self.isClassifying = false
        }
    }
    
    private func handleSave() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        withAnimation {
            isSaved = true
        }
        
        let card = ShareCardModel(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            notes: notes,
            urlString: url?.absoluteString,
            type: type,
            category: categoryText,
            tags: tags,
            targetColumn: selectedColumn,
            aiSummary: aiSummaryText,
            pdfFileName: pdfFileName
        )
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onSave(card)
        }
    }
}
