import SwiftUI
import WatchKit

// MARK: - Navigation Routes

public enum WatchNavRoute: Hashable {
    case boardLists(boardId: String)
    case listChecklist(listId: String)
    case cardChecklist(cardId: String)
    case badges
}

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 34, 197, 94) // Default Minest green
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Root Watch View (Navigation Stack Coordinator)

public struct WatchChecklistView: View {
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @State private var navPath: NavigationPath
    
    public init() {
        var path = NavigationPath()
        let bId = WatchSyncManager.shared.selectedBoardId
        let lId = WatchSyncManager.shared.selectedListId
        path.append(WatchNavRoute.boardLists(boardId: bId))
        path.append(WatchNavRoute.listChecklist(listId: lId))
        _navPath = State(initialValue: path)
    }
    
    public var body: some View {
        NavigationStack(path: $navPath) {
            // Level 3 Root: Boards List ("后面可以选择borad")
            WatchBoardsListView(onSelectBoard: { boardId in
                syncManager.selectBoard(id: boardId)
                navPath.append(WatchNavRoute.boardLists(boardId: boardId))
            })
            .navigationDestination(for: WatchNavRoute.self) { route in
                switch route {
                case .boardLists(let boardId):
                    // Level 2: Lists in Selected Board ("返回键后可以选择默认board的list")
                    WatchBoardListsView(boardId: boardId, onSelectList: { listId in
                        syncManager.selectList(id: listId)
                        navPath.append(WatchNavRoute.listChecklist(listId: listId))
                    })
                    
                case .listChecklist(let listId):
                    // Level 1: Cards Checklist View ("进去直接显示打勾界面")
                    WatchListChecklistView(listId: listId)
                    
                case .cardChecklist(let cardId):
                    // Drill-down: Card Sub-checklists
                    WatchCardChecklistView(cardId: cardId)
                    
                case .badges:
                    // 3-Ring Activity & Digital Badges Center
                    WatchBadgesView()
                }
            }
        }
        .onChange(of: syncManager.selectedListId) { newListId in
            // When selection updates from phone or sync resolves, synchronize stack
            var newPath = NavigationPath()
            newPath.append(WatchNavRoute.boardLists(boardId: syncManager.selectedBoardId))
            newPath.append(WatchNavRoute.listChecklist(listId: newListId))
            navPath = newPath
        }
    }
}

// MARK: - Level 1: Active List Checklist View (Apple Reminders Style)
// "进去直接显示打勾界面，滚动到list底部可以添加卡片"

public struct WatchListChecklistView: View {
    let listId: String
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @State private var showingAddCardSheet = false
    
    private var currentList: WatchListModel {
        syncManager.boards.flatMap(\.lists).first(where: { $0.id == listId })
            ?? syncManager.currentLists.first(where: { $0.id == listId })
            ?? syncManager.currentList
            ?? WatchListModel(id: listId, name: "清单", cards: [])
    }
    
    private var parentBoard: WatchBoardModel? {
        syncManager.boards.first(where: { $0.lists.contains(where: { $0.id == listId }) })
            ?? syncManager.currentBoard
    }
    
    public var body: some View {
        List {
            // Apple Reminders Header: Large Bold Colored Title & Status
            Section {
                VStack(alignment: .leading, spacing: 3) {
                    Text(currentList.name)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundColor(Color(hex: currentList.colorHex))
                        .lineLimit(1)
                    
                    if currentList.totalCardsCount > 0 {
                        Text("\(currentList.completedCardsCount)/\(currentList.totalCardsCount) 已完成")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 2)
            }
            .listRowBackground(Color.clear)
            
            // Cards Rows (Apple Reminders Checkable Items)
            if currentList.cards.isEmpty {
                Section {
                    VStack(spacing: 6) {
                        Image(systemName: "square.dashed")
                            .font(.system(size: 22))
                            .foregroundColor(.secondary)
                        Text("暂无卡片")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
                .listRowBackground(Color.clear)
            } else {
                Section {
                    ForEach(currentList.cards) { card in
                        HStack(alignment: .center, spacing: 9) {
                            // Apple Reminders Circular Checkbox Button
                            Button {
                                syncManager.toggleCard(cardId: card.id)
                            } label: {
                                ZStack {
                                    if card.isCompleted {
                                        Circle()
                                            .fill(Color(hex: currentList.colorHex))
                                            .frame(width: 21, height: 21)
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 10, weight: .black))
                                            .foregroundColor(.black)
                                    } else {
                                        Circle()
                                            .stroke(Color.secondary.opacity(0.5), lineWidth: 1.8)
                                            .frame(width: 21, height: 21)
                                    }
                                }
                                .contentShape(Circle())
                            }
                            .buttonStyle(.plain)
                            
                            // Card Title & Drill-down Link
                            if card.hasChecklist || !card.items.isEmpty {
                                NavigationLink(value: WatchNavRoute.cardChecklist(cardId: card.id)) {
                                    HStack(spacing: 4) {
                                        Text(card.title)
                                            .font(.system(size: 13, weight: card.isCompleted ? .regular : .semibold))
                                            .strikethrough(card.isCompleted, color: .secondary.opacity(0.6))
                                            .foregroundColor(card.isCompleted ? .secondary : .primary)
                                            .lineLimit(2)
                                        
                                        Spacer(minLength: 2)
                                        
                                        HStack(spacing: 3) {
                                            Text("\(card.completedCount)/\(card.totalCount)")
                                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 8, weight: .bold))
                                        }
                                        .foregroundColor(Color(hex: currentList.colorHex))
                                        .padding(.horizontal, 5)
                                        .padding(.vertical, 2)
                                        .background(Capsule().fill(Color(hex: currentList.colorHex).opacity(0.16)))
                                    }
                                }
                                .buttonStyle(.plain)
                            } else {
                                Text(card.title)
                                    .font(.system(size: 13, weight: card.isCompleted ? .regular : .semibold))
                                    .strikethrough(card.isCompleted, color: .secondary.opacity(0.6))
                                    .foregroundColor(card.isCompleted ? .secondary : .primary)
                                    .lineLimit(2)
                                
                                Spacer(minLength: 4)
                            }
                        }
                        .padding(.vertical, 3)
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                syncManager.deleteCard(cardId: card.id)
                            } label: {
                                Label("删除", systemImage: "trash")
                            }
                        }
                    }
                    .onDelete { offsets in
                        for index in offsets {
                            if index < currentList.cards.count {
                                syncManager.deleteCard(cardId: currentList.cards[index].id)
                            }
                        }
                    }
                }
            }
            
            // "滚动到list底部可以添加卡片": Apple Reminders Bottom "+ 新建卡片" Button
            Section {
                Button {
                    showingAddCardSheet = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(hex: currentList.colorHex))
                        
                        Text("新建卡片")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color(hex: currentList.colorHex))
                        
                        Spacer()
                    }
                    .padding(.vertical, 5)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .listRowBackground(Color.clear)
        }
        .navigationTitle(currentList.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: WatchNavRoute.badges) {
                    WatchMiniThreeRingsView(ringsState: syncManager.ringsState, size: 20)
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showingAddCardSheet) {
            WatchAddCardSheet(listId: currentList.id, listName: currentList.name, colorHex: currentList.colorHex)
        }
    }
}

// MARK: - Level 2: Board Lists Selector View
// "返回键后可以选择默认board的list"

public struct WatchBoardListsView: View {
    let boardId: String
    var onSelectList: ((String) -> Void)?
    
    @ObservedObject private var syncManager = WatchSyncManager.shared
    
    private var board: WatchBoardModel {
        syncManager.boards.first(where: { $0.id == boardId })
            ?? syncManager.currentBoard
            ?? WatchBoardModel(id: boardId, title: "看板", lists: [])
    }
    
    public var body: some View {
        List {
            Section(header: Text("列表清单").font(.system(size: 11)).foregroundColor(.secondary)) {
                ForEach(board.lists) { list in
                    Button {
                        onSelectList?(list.id)
                    } label: {
                        HStack(spacing: 8) {
                            // Apple Reminders Icon Badge
                            ZStack {
                                Circle()
                                    .fill(Color(hex: list.colorHex))
                                    .frame(width: 24, height: 24)
                                Image(systemName: list.icon)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            Text(list.name)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.primary)
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Text("\(list.cards.count)")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundColor(.secondary)
                            
                            Image(systemName: "chevron.right")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle(board.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: WatchNavRoute.badges) {
                    WatchMiniThreeRingsView(ringsState: syncManager.ringsState, size: 20)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Level 3: Boards Selector View
// "后面可以选择borad"

public struct WatchBoardsListView: View {
    var onSelectBoard: ((String) -> Void)?
    
    @ObservedObject private var syncManager = WatchSyncManager.shared
    
    public var body: some View {
        List {
            Section(header: Text("所有看板").font(.system(size: 11)).foregroundColor(.secondary)) {
                ForEach(syncManager.boards) { board in
                    Button {
                        onSelectBoard?(board.id)
                    } label: {
                        HStack(spacing: 8) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 6, style: .continuous)
                                    .fill(Color(hex: board.colorHex))
                                    .frame(width: 26, height: 26)
                                Image(systemName: board.icon)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 1) {
                                Text(board.title)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Text("\(board.lists.count)个列表 · \(board.totalCardsCount)张卡")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle("Minest 看板")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: WatchNavRoute.badges) {
                    WatchMiniThreeRingsView(ringsState: syncManager.ringsState, size: 20)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Card Sub-Checklist Detail Drill-down View

public struct WatchCardChecklistView: View {
    let cardId: String
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @State private var showingAddItemSheet = false
    
    private var card: WatchCardModel? {
        for list in syncManager.currentLists {
            if let c = list.cards.first(where: { $0.id == cardId }) {
                return c
            }
        }
        return nil
    }
    
    private var currentList: WatchListModel? {
        syncManager.currentList
    }
    
    public var body: some View {
        List {
            if let card = card {
                // Card Header
                Section {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(card.title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.primary)
                            .lineLimit(2)
                        
                        Text("\(card.completedCount) / \(card.totalCount) 子任务完成")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 2)
                }
                .listRowBackground(Color.clear)
                
                // Checklist Items
                if card.items.isEmpty {
                    Section {
                        Text("无子任务清单")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.vertical, 8)
                    }
                    .listRowBackground(Color.clear)
                } else {
                    Section {
                        ForEach(card.items) { item in
                            HStack(alignment: .center, spacing: 8) {
                                Button {
                                    syncManager.toggleItem(cardId: card.id, itemId: item.id)
                                } label: {
                                    ZStack {
                                        if item.isDone {
                                            Circle()
                                                .fill(Color(hex: currentList?.colorHex ?? "#22C55E"))
                                                .frame(width: 20, height: 20)
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 10, weight: .black))
                                                .foregroundColor(.black)
                                        } else {
                                            Circle()
                                                .stroke(Color.secondary.opacity(0.5), lineWidth: 1.8)
                                                .frame(width: 20, height: 20)
                                        }
                                    }
                                    .contentShape(Circle())
                                }
                                .buttonStyle(.plain)
                                
                                Text(item.text)
                                    .font(.system(size: 13, weight: item.isDone ? .regular : .medium))
                                    .strikethrough(item.isDone, color: .secondary)
                                    .foregroundColor(item.isDone ? .secondary : .primary)
                                    .lineLimit(2)
                                
                                Spacer()
                            }
                            .padding(.vertical, 3)
                        }
                        .onDelete { offsets in
                            syncManager.deleteChecklistItem(cardId: card.id, at: offsets)
                        }
                    }
                }
                
                // Add Sub-item at bottom
                Section {
                    Button {
                        showingAddItemSheet = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(Color(hex: currentList?.colorHex ?? "#22C55E"))
                            Text("添加子清单项")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Color(hex: currentList?.colorHex ?? "#22C55E"))
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.plain)
                }
                .listRowBackground(Color.clear)
            } else {
                Text("卡片不存在")
                    .foregroundColor(.secondary)
            }
        }
        .navigationTitle(currentList?.name ?? "返回")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAddItemSheet) {
            WatchAddSubItemSheet(cardId: cardId, colorHex: currentList?.colorHex ?? "#22C55E")
        }
    }
}

// MARK: - Add Card Sheet (Dictation / Scribble on Apple Watch)

public struct WatchAddCardSheet: View {
    let listId: String
    let listName: String
    var colorHex: String = "#22C55E"
    
    @Environment(\.dismiss) private var dismiss
    @State private var cardTitle: String = ""
    @ObservedObject private var syncManager = WatchSyncManager.shared
    
    public var body: some View {
        VStack(spacing: 8) {
            Text("新建卡片至「\(listName)」")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color(hex: colorHex))
                .lineLimit(1)
            
            TextField("输入或语音卡片内容...", text: $cardTitle)
                .font(.system(size: 13))
            
            HStack(spacing: 8) {
                Button("取消") {
                    dismiss()
                }
                .tint(.secondary)
                
                Button("添加") {
                    let trimmed = cardTitle.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !trimmed.isEmpty {
                        syncManager.addCard(title: trimmed, listId: listId)
                        dismiss()
                    }
                }
                .tint(Color(hex: colorHex))
                .disabled(cardTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(.horizontal, 6)
    }
}

// MARK: - Add Sub-item Sheet

public struct WatchAddSubItemSheet: View {
    let cardId: String
    var colorHex: String = "#22C55E"
    
    @Environment(\.dismiss) private var dismiss
    @State private var itemText: String = ""
    @ObservedObject private var syncManager = WatchSyncManager.shared
    
    public var body: some View {
        VStack(spacing: 8) {
            Text("新建子任务项")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(Color(hex: colorHex))
            
            TextField("输入或语音任务项...", text: $itemText)
                .font(.system(size: 13))
            
            HStack(spacing: 8) {
                Button("取消") {
                    dismiss()
                }
                .tint(.secondary)
                
                Button("添加") {
                    let trimmed = itemText.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !trimmed.isEmpty {
                        syncManager.addChecklistItem(cardId: cardId, text: trimmed)
                        dismiss()
                    }
                }
                .tint(Color(hex: colorHex))
                .disabled(itemText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(.horizontal, 6)
    }
}

// MARK: - Mini 3 Concentric Activity Rings (Apple Fitness Style)

public struct WatchMiniThreeRingsView: View {
    let ringsState: ActivityRingsState
    var size: CGFloat = 22
    
    public init(ringsState: ActivityRingsState, size: CGFloat = 22) {
        self.ringsState = ringsState
        self.size = size
    }
    
    public var body: some View {
        ZStack {
            // Ring 1 (Red #FA114F): 专注时长 (Focus duration)
            Circle()
                .stroke(Color(hex: "#FA114F").opacity(0.22), lineWidth: size * 0.12)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(ringsState.focusProgress, 0), 1.0)))
                .stroke(
                    Color(hex: "#FA114F"),
                    style: StrokeStyle(lineWidth: size * 0.12, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            
            // Ring 2 (Green #30D158): 打勾进阶 (Check frequency & card progress)
            Circle()
                .stroke(Color(hex: "#30D158").opacity(0.22), lineWidth: size * 0.12)
                .padding(size * 0.16)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(ringsState.checkProgress, 0), 1.0)))
                .stroke(
                    Color(hex: "#30D158"),
                    style: StrokeStyle(lineWidth: size * 0.12, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .padding(size * 0.16)
            
            // Ring 3 (Cyan #00FFF0): 每日目标 (Daily goal completion)
            Circle()
                .stroke(Color(hex: "#00FFF0").opacity(0.22), lineWidth: size * 0.12)
                .padding(size * 0.32)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(ringsState.goalProgress, 0), 1.0)))
                .stroke(
                    Color(hex: "#00FFF0"),
                    style: StrokeStyle(lineWidth: size * 0.12, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .padding(size * 0.32)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Activity Rings & Badges View (Apple Watch)

public struct WatchBadgesView: View {
    @ObservedObject private var syncManager = WatchSyncManager.shared
    @State private var selectedBadgeFor3D: WatchBadgeModel? = nil
    
    public init() {}
    
    public var body: some View {
        List {
            // Hero: Concentric 3-Rings Graphic & Metrics
            Section {
                VStack(spacing: 8) {
                    WatchMiniThreeRingsView(ringsState: syncManager.ringsState, size: 76)
                        .padding(.top, 4)
                    
                    if syncManager.ringsState.isAllClosed {
                        HStack(spacing: 4) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(hex: "#FFD700"))
                            Text("今日三圈圆满闭环！")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(hex: "#FFD700"))
                        }
                    } else {
                        Text("今日已闭环 \(syncManager.ringsState.closedRingsCount) / 3 圈")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }
            
            // 3 Rings Detailed Breakdown
            Section(header: Text("三圈闭环指标").font(.system(size: 11)).foregroundColor(.secondary)) {
                // Ring 1: 专注时长
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color(hex: "#FA114F"))
                        .frame(width: 9, height: 9)
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text("专注时长")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.primary)
                        Text("目标 \(syncManager.ringsState.targetMinutes) 分钟")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 2) {
                        Text("\(syncManager.ringsState.focusMinutes)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(hex: "#FA114F"))
                        Text("m")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    if syncManager.ringsState.focusMinutes >= syncManager.ringsState.targetMinutes {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#FA114F"))
                    }
                }
                .padding(.vertical, 2)
                
                // Ring 2: 打勾进阶
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color(hex: "#30D158"))
                        .frame(width: 9, height: 9)
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text("打勾进阶")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.primary)
                        Text("目标 \(syncManager.ringsState.targetChecks) 次勾选")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 2) {
                        Text("\(syncManager.ringsState.checkCount)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(hex: "#30D158"))
                        Text("次")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    if syncManager.ringsState.checkCount >= syncManager.ringsState.targetChecks {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#30D158"))
                    }
                }
                .padding(.vertical, 2)
                
                // Ring 3: 每日目标
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color(hex: "#00FFF0"))
                        .frame(width: 9, height: 9)
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text("每日目标")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.primary)
                        Text("当前看板全清")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 2) {
                        Text("\(syncManager.ringsState.goalPercent)%")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(hex: "#00FFF0"))
                    }
                    
                    if syncManager.ringsState.goalPercent >= 100 {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#00FFF0"))
                    }
                }
                .padding(.vertical, 2)
            }
            
            // Badges Wall Section
            Section(header: Text("3D 电子勋章 (\(syncManager.unlockedBadgesCount)/\(syncManager.badges.count)) · 点按进入3D旋转").font(.system(size: 10)).foregroundColor(.secondary)) {
                ForEach(syncManager.badges) { badge in
                    Button(action: {
                        selectedBadgeFor3D = badge
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 8) {
                            // Badge Icon with 3-Ring Glowing Frame
                            ZStack {
                                Circle()
                                    .fill(badge.isUnlocked ? Color(hex: badge.colorHex).opacity(0.2) : Color.white.opacity(0.08))
                                    .frame(width: 30, height: 30)
                                
                                Circle()
                                    .stroke(badge.isUnlocked ? Color(hex: badge.colorHex) : Color.white.opacity(0.15), lineWidth: 1.5)
                                    .frame(width: 30, height: 30)
                                
                                Image(systemName: badge.isUnlocked ? badge.icon : "lock.fill")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(badge.isUnlocked ? Color(hex: badge.colorHex) : .secondary)
                            }
                            
                            VStack(alignment: .leading, spacing: 1) {
                                HStack(spacing: 4) {
                                    Text(badge.title)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(badge.isUnlocked ? .primary : .secondary)
                                    
                                    if badge.isUnlocked {
                                        Text("已点亮")
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(Color(hex: badge.colorHex))
                                            .padding(.horizontal, 4)
                                            .padding(.vertical, 1)
                                            .background(Capsule().fill(Color(hex: badge.colorHex).opacity(0.18)))
                                    }
                                }
                                
                                Text(badge.subtitle)
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "cube.transparent")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary.opacity(0.6))
                        }
                        .padding(.vertical, 3)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle("活动与勋章")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedBadgeFor3D) { badge in
            Watch3DMedalSheet(badge: badge)
        }
    }
}

// MARK: - 3D Rotatable Apple Watch Medal Sheet

public struct Watch3DMedalSheet: View {
    let badge: WatchBadgeModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var rotationAngle: Double = 0
    @State private var crownAngle: Double = 0
    
    private var isBackFace: Bool {
        let norm = abs(rotationAngle.truncatingRemainder(dividingBy: 360))
        return norm > 90 && norm < 270
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Top Dismiss
                HStack {
                    Spacer()
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 2)
                
                // 3D Rotatable Medal Stage
                ZStack {
                    if isBackFace {
                        WatchMedalBackFace(badge: badge)
                            .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                    } else {
                        WatchMedalFrontFace(badge: badge)
                    }
                }
                .frame(width: 120, height: 120)
                .rotation3DEffect(
                    .degrees(rotationAngle),
                    axis: (x: 0, y: 1, z: 0),
                    perspective: 0.4
                )
                .gesture(
                    DragGesture()
                        .onChanged { val in
                            rotationAngle += Double(val.translation.width) * 0.12
                            WKInterfaceDevice.current().play(.click)
                        }
                )
                .focusable(true)
                .digitalCrownRotation(
                    $crownAngle,
                    from: -720,
                    through: 720,
                    by: 2,
                    sensitivity: .medium,
                    isContinuous: true,
                    isHapticFeedbackEnabled: true
                )
                .onChange(of: crownAngle) { newAngle in
                    rotationAngle = newAngle
                }
                
                // Title & Subtitle
                VStack(spacing: 2) {
                    Text(badge.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text(badge.subtitle)
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal, 4)
                }
                
                // Status pill
                if badge.isUnlocked {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 9))
                        Text("3环勋章已点亮")
                            .font(.system(size: 9, weight: .bold))
                    }
                    .foregroundColor(Color(hex: badge.colorHex))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(Color(hex: badge.colorHex).opacity(0.18)))
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 9))
                        Text("挑战进行中")
                            .font(.system(size: 9, weight: .semibold))
                    }
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(Color.white.opacity(0.1)))
                }
                
                // Action: Flip Front/Back Button
                Button(action: {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                        rotationAngle += isBackFace ? -180 : 180
                        crownAngle = rotationAngle
                    }
                    WKInterfaceDevice.current().play(.directionUp)
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                        Text(isBackFace ? "看正面" : "翻转看背面")
                    }
                    .font(.system(size: 11, weight: .medium))
                }
                .buttonStyle(.bordered)
                .tint(.secondary)
                
                Text("旋转数码表冠或拖动可 3D 旋转")
                    .font(.system(size: 8))
                    .foregroundColor(.secondary.opacity(0.6))
                    .padding(.bottom, 4)
            }
        }
    }
}

// MARK: - 3D Medal Front Face (Watch 3-Rings Medallion)

struct WatchMedalFrontFace: View {
    let badge: WatchBadgeModel
    
    var body: some View {
        ZStack {
            // Layer 1: Metallic Rim Bezel
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: badge.isUnlocked ? [Color(hex: "#FFE082"), Color(hex: "#B8860B"), Color(hex: "#78500C")] : [Color.gray.opacity(0.4), Color.gray.opacity(0.2)]),
                        center: .center,
                        startRadius: 36,
                        endRadius: 58
                    )
                )
                .overlay(
                    Circle().stroke(badge.isUnlocked ? Color(hex: "#FFF3B0") : Color.white.opacity(0.2), lineWidth: 1.5)
                )
                .shadow(color: Color.black.opacity(0.5), radius: 5, x: 0, y: 2)
            
            // Layer 2: Inner Dark Enamel Dish
            Circle()
                .fill(RadialGradient(gradient: Gradient(colors: [Color(hex: "#111827"), Color.black]), center: .center, startRadius: 0, endRadius: 50))
                .padding(6)
            
            // Layer 3: Concentric Apple Watch 3-Rings
            // Outer Ring: Red #FA114F (Focus)
            Circle()
                .stroke(Color(hex: "#FA114F").opacity(0.25), lineWidth: 4)
                .padding(9)
            Circle()
                .trim(from: 0, to: badge.isUnlocked ? 1.0 : 0.65)
                .stroke(Color(hex: "#FA114F"), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(9)
                .shadow(color: badge.isUnlocked ? Color(hex: "#FA114F").opacity(0.8) : .clear, radius: 2)
            
            // Middle Ring: Green #30D158 (Checks)
            Circle()
                .stroke(Color(hex: "#30D158").opacity(0.25), lineWidth: 4)
                .padding(16)
            Circle()
                .trim(from: 0, to: badge.isUnlocked ? 1.0 : 0.5)
                .stroke(Color(hex: "#30D158"), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(16)
                .shadow(color: badge.isUnlocked ? Color(hex: "#30D158").opacity(0.8) : .clear, radius: 2)
            
            // Inner Ring: Cyan #00FFF0 (Goal)
            Circle()
                .stroke(Color(hex: "#00FFF0").opacity(0.25), lineWidth: 4)
                .padding(23)
            Circle()
                .trim(from: 0, to: badge.isUnlocked ? 1.0 : 0.4)
                .stroke(Color(hex: "#00FFF0"), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(23)
                .shadow(color: badge.isUnlocked ? Color(hex: "#00FFF0").opacity(0.8) : .clear, radius: 2)
            
            // Center Core: Raised Medallion with Badge Icon
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: badge.isUnlocked ? [Color(hex: "#FDE047"), Color(hex: "#CA8A04")] : [Color.gray.opacity(0.6), Color.gray.opacity(0.3)]),
                            center: .center,
                            startRadius: 0,
                            endRadius: 18
                        )
                    )
                    .frame(width: 38, height: 38)
                    .overlay(
                        Circle().stroke(badge.isUnlocked ? Color(hex: "#FEF08A") : Color.white.opacity(0.2), lineWidth: 1.5)
                    )
                    .shadow(color: Color.black.opacity(0.4), radius: 3, x: 0, y: 1)
                
                Image(systemName: badge.icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(badge.isUnlocked ? Color(hex: "#451A03") : .white.opacity(0.7))
            }
            
            // Specular glass gleam
            LinearGradient(
                gradient: Gradient(colors: [Color.white.opacity(0.25), Color.clear, Color.clear]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(Circle())
            .padding(6)
        }
    }
}

// MARK: - 3D Medal Back Face (Engraved Metallic Reverse)

struct WatchMedalBackFace: View {
    let badge: WatchBadgeModel
    
    var body: some View {
        ZStack {
            // Metallic Brushed Backplate
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: badge.isUnlocked ? [Color(hex: "#FEF08A"), Color(hex: "#CA8A04"), Color(hex: "#854D0E")] : [Color.gray.opacity(0.5), Color.gray.opacity(0.2)]),
                        center: .center,
                        startRadius: 0,
                        endRadius: 58
                    )
                )
                .overlay(
                    Circle().stroke(badge.isUnlocked ? Color(hex: "#B45309") : Color.white.opacity(0.2), lineWidth: 2.5)
                )
                .shadow(color: Color.black.opacity(0.5), radius: 5, x: 0, y: 2)
            
            // Concentric Engraving Rings
            Circle()
                .stroke(Color.black.opacity(0.15), lineWidth: 1)
                .padding(9)
            Circle()
                .stroke(Color.black.opacity(0.15), lineWidth: 1)
                .padding(16)
            
            // Engraved Text
            VStack(spacing: 2) {
                Text("★ MINEST 3 RINGS ★")
                    .font(.system(size: 7, weight: .black))
                    .foregroundColor(badge.isUnlocked ? Color(hex: "#78350F") : Color.white.opacity(0.7))
                
                VStack(spacing: 1) {
                    Text(badge.title)
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(badge.isUnlocked ? Color(hex: "#451A03") : Color.white)
                    
                    Text(badge.isUnlocked ? "✓ 闭环达成" : "🔒 待点亮")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(badge.isUnlocked ? Color(hex: "#15803D") : Color.white.opacity(0.6))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 1)
                        .background(Capsule().fill(Color.black.opacity(0.15)))
                }
                
                Text("3D MEDAL 2026")
                    .font(.system(size: 6, weight: .semibold, design: .monospaced))
                    .foregroundColor(badge.isUnlocked ? Color(hex: "#78350F") : Color.white.opacity(0.5))
            }
            .padding(10)
        }
    }
}

