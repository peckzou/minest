import AppKit

protocol MenuBarManagerDelegate: AnyObject {
    func menuBarDidTogglePetVisibility()
    func menuBarDidToggleKeepVisible()
    func menuBarDidRequestNextAction()
    func menuBarDidRequestTalk()
    func menuBarDidRequestPet()
    func menuBarDidRequestOpenMinest()
    func menuBarDidRequestOpenPetMode()
    func menuBarDidRequestTriggerReward(kind: String)
    func menuBarDidRequestQuit()
}

final class MenuBarManager: NSObject {
    weak var delegate: MenuBarManagerDelegate?

    private var statusItem: NSStatusItem?
    private var isPetVisible: Bool = true
    private var isKeepVisible: Bool = false
    private var isLinked: Bool = false

    func setupStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = item.button {
            // the iPhone dock's octopus: a plain line icon that follows the menu bar (light / dark)
            button.image = MenuBarManager.octopusIcon()
            button.imagePosition = .imageOnly
            button.toolTip = "Minest Desktop Pet (Mini P0)"
        }

        let menu = NSMenu(title: "Minest Pet")
        item.menu = menu
        self.statusItem = item
        updateStatusMenu()
    }

    /// linked to the Minest page in the browser (the pet then mirrors the web Mini Pet)
    func updateLink(connected: Bool) {
        isLinked = connected
        // not linked to the web page: the icon is dimmed
        statusItem?.button?.appearsDisabled = !connected
        statusItem?.button?.toolTip = connected ? "Minest Desktop Pet — linked to Minest Web" : "Minest Desktop Pet — not linked (open Minest Web)"
        updateStatusMenu()
    }

    func updateState(isPetVisible: Bool, isKeepVisible: Bool) {
        self.isPetVisible = isPetVisible
        self.isKeepVisible = isKeepVisible
        updateStatusMenu()
    }

    private func updateStatusMenu() {
        guard let menu = statusItem?.menu else { return }
        menu.removeAllItems()

        // 1. Header item
        let header = NSMenuItem(title: "Minest Desktop Pet", action: nil, keyEquivalent: "")
        header.isEnabled = false
        menu.addItem(header)

        let linkItem = NSMenuItem(title: isLinked ? "🔗 Linked to Minest" : "○ Not linked — open Minest in the browser", action: isLinked ? nil : #selector(handleOpenMinest), keyEquivalent: "")
        linkItem.target = self
        linkItem.isEnabled = !isLinked
        menu.addItem(linkItem)

        menu.addItem(NSMenuItem.separator())

        // 2. Visibility & Keep Visible
        let toggleVis = NSMenuItem(
            title: isPetVisible ? "👁️ Hide Desktop Pet" : "👁️ Show Desktop Pet",
            action: #selector(handleToggleVisibility),
            keyEquivalent: "h"
        )
        toggleVis.target = self
        menu.addItem(toggleVis)

        let toggleKeep = NSMenuItem(
            title: "📌 Keep Visible (Always on Top)",
            action: #selector(handleToggleKeepVisible),
            keyEquivalent: "t"
        )
        toggleKeep.target = self
        toggleKeep.state = isKeepVisible ? .on : .off
        menu.addItem(toggleKeep)

        menu.addItem(NSMenuItem.separator())

        // 3. Quick Actions
        let switchActionItem = NSMenuItem(title: "🔀 Switch Action (换动作)", action: #selector(handleNextAction), keyEquivalent: "s")
        switchActionItem.target = self
        menu.addItem(switchActionItem)

        let talkItem = NSMenuItem(title: "🗣️ Talk", action: #selector(handleTalk), keyEquivalent: "")
        talkItem.target = self
        menu.addItem(talkItem)

        let petItem = NSMenuItem(title: "💖 Pet the Octopus", action: #selector(handlePet), keyEquivalent: "")
        petItem.target = self
        menu.addItem(petItem)

        menu.addItem(NSMenuItem.separator())

        // 4. Minest Links
        let openMinest = NSMenuItem(title: "📖 Open Minest", action: #selector(handleOpenMinest), keyEquivalent: "o")
        openMinest.target = self
        menu.addItem(openMinest)

        let openPetMode = NSMenuItem(title: "🌊 Open Full Pet Mode", action: #selector(handleOpenPetMode), keyEquivalent: "p")
        openPetMode.target = self
        menu.addItem(openPetMode)

        menu.addItem(NSMenuItem.separator())

        // 5. Test Rewards Submenu (for Verification)
        let rewardMenu = NSMenu(title: "Reward Events")
        let taskReward = NSMenuItem(title: "🎯 Task Completed", action: #selector(handleTestTask), keyEquivalent: "")
        taskReward.target = self
        rewardMenu.addItem(taskReward)

        let goalReward = NSMenuItem(title: "🎉 Goal Milestone", action: #selector(handleTestGoal), keyEquivalent: "")
        goalReward.target = self
        rewardMenu.addItem(goalReward)

        let badgeReward = NSMenuItem(title: "🏆 Badge Unlocked", action: #selector(handleTestBadge), keyEquivalent: "")
        badgeReward.target = self
        rewardMenu.addItem(badgeReward)

        let rewardItem = NSMenuItem(title: "⚡ Simulate Reward Event", action: nil, keyEquivalent: "")
        rewardItem.submenu = rewardMenu
        menu.addItem(rewardItem)

        menu.addItem(NSMenuItem.separator())

        // 6. Quit
        let quitItem = NSMenuItem(title: "✕ Quit Desktop Pet", action: #selector(handleQuit), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
    }

    // MARK: - Native Popover / Context Menu on Pet Click
    func showCompactInteractionMenu(at screenPoint: NSPoint) {
        let menu = NSMenu(title: "Desktop Pet")

        let talkItem = NSMenuItem(title: "🗣️ Talk", action: #selector(handleTalk), keyEquivalent: "")
        talkItem.target = self
        menu.addItem(talkItem)

        let petItem = NSMenuItem(title: "💖 Pet", action: #selector(handlePet), keyEquivalent: "")
        petItem.target = self
        menu.addItem(petItem)

        menu.addItem(NSMenuItem.separator())

        let openMinest = NSMenuItem(title: "📖 Open Minest", action: #selector(handleOpenMinest), keyEquivalent: "")
        openMinest.target = self
        menu.addItem(openMinest)

        let openPetMode = NSMenuItem(title: "🌊 Open Pet Mode", action: #selector(handleOpenPetMode), keyEquivalent: "")
        openPetMode.target = self
        menu.addItem(openPetMode)

        menu.addItem(NSMenuItem.separator())

        let hideItem = NSMenuItem(title: "👁️ Hide", action: #selector(handleToggleVisibility), keyEquivalent: "")
        hideItem.target = self
        menu.addItem(hideItem)

        menu.popUp(positioning: nil, at: screenPoint, in: nil)
    }

    func showContextMenu(at screenPoint: NSPoint) {
        let menu = NSMenu(title: "Desktop Pet Menu")

        let openMinest = NSMenuItem(title: "📖 Open Minest", action: #selector(handleOpenMinest), keyEquivalent: "")
        openMinest.target = self
        menu.addItem(openMinest)

        let openPetMode = NSMenuItem(title: "🌊 Open Pet Mode", action: #selector(handleOpenPetMode), keyEquivalent: "")
        openPetMode.target = self
        menu.addItem(openPetMode)

        let switchActionItem = NSMenuItem(title: "🔀 Switch Action (换动作)", action: #selector(handleNextAction), keyEquivalent: "")
        switchActionItem.target = self
        menu.addItem(switchActionItem)

        let talkItem = NSMenuItem(title: "🗣️ Talk", action: #selector(handleTalk), keyEquivalent: "")
        talkItem.target = self
        menu.addItem(talkItem)

        menu.addItem(NSMenuItem.separator())

        let keepVisibleItem = NSMenuItem(title: "📌 Keep Visible", action: #selector(handleToggleKeepVisible), keyEquivalent: "")
        keepVisibleItem.target = self
        keepVisibleItem.state = isKeepVisible ? .on : .off
        menu.addItem(keepVisibleItem)

        let hideItem = NSMenuItem(title: "👁️ Hide Pet", action: #selector(handleToggleVisibility), keyEquivalent: "")
        hideItem.target = self
        menu.addItem(hideItem)

        menu.addItem(NSMenuItem.separator())

        let quitItem = NSMenuItem(title: "✕ Quit Desktop Pet", action: #selector(handleQuit), keyEquivalent: "")
        quitItem.target = self
        menu.addItem(quitItem)

        menu.popUp(positioning: nil, at: screenPoint, in: nil)
    }

    // MARK: - Actions
    @objc private func handleNextAction() { delegate?.menuBarDidRequestNextAction() }
    @objc private func handleToggleVisibility() { delegate?.menuBarDidTogglePetVisibility() }
    @objc private func handleToggleKeepVisible() { delegate?.menuBarDidToggleKeepVisible() }
    @objc private func handleTalk() { delegate?.menuBarDidRequestTalk() }
    @objc private func handlePet() { delegate?.menuBarDidRequestPet() }
    @objc private func handleOpenMinest() { delegate?.menuBarDidRequestOpenMinest() }
    @objc private func handleOpenPetMode() { delegate?.menuBarDidRequestOpenPetMode() }
    @objc private func handleTestTask() { delegate?.menuBarDidRequestTriggerReward(kind: "task") }
    @objc private func handleTestGoal() { delegate?.menuBarDidRequestTriggerReward(kind: "goal") }
    @objc private func handleTestBadge() { delegate?.menuBarDidRequestTriggerReward(kind: "badge") }
    @objc private func handleQuit() { delegate?.menuBarDidRequestQuit() }

    // MARK: - the menu bar icon (the iPhone dock's Pet Raising octopus, drawn from its 24×24 SVG paths)

    private static let octopusPaths = [
        "M12 3.2C8 3.2 5.2 6.2 5.2 10c0 2.4 1.2 4.4 3 5.4v.6c0 1.2-.8 2-1.8 2-1.2 0-1.8-1.1-1.4-2.4",
        "M18.8 15.6c.4 1.3-.2 2.4-1.4 2.4-1 0-1.8-.8-1.8-2v-.6c1.8-1 3-3 3-5.4 0-3.8-2.8-6.8-6.8-6.8",
        "M9.5 16v1.8c0 1.6-.8 2.6-1.8 2.6-1.1 0-1.6-1.2-1.1-2.4",
        "M14.5 16v1.8c0 1.6.8 2.6 1.8 2.6 1.1 0 1.6-1.2 1.1-2.4",
        "M12 16v2.2c0 1.8-.6 2.8-1.5 2.8-.8 0-1.2-.9-.9-2",
        "M10.8 12c.7.5 1.7.5 2.4 0"
    ]

    static func octopusIcon(size: CGFloat = 18) -> NSImage {
        let image = NSImage(size: NSSize(width: size, height: size), flipped: true) { _ in
            let k = size / 24
            let t = AffineTransform(scaleByX: k, byY: k)
            NSColor.black.setStroke()
            NSColor.black.setFill()
            for d in octopusPaths {
                let p = svgPath(d)
                p.transform(using: t)
                p.lineWidth = 1.75 * k
                p.lineCapStyle = .round
                p.lineJoinStyle = .round
                p.stroke()
            }
            for cx in [9.2, 14.8] {
                let r = 1.15 * k
                NSBezierPath(ovalIn: NSRect(x: cx * k - r, y: 9.2 * k - r, width: 2 * r, height: 2 * r)).fill()
            }
            return true
        }
        image.isTemplate = true
        return image
    }

    /// a small SVG path reader: M m L l H h V v C c Z z (all these icons need)
    private static func svgPath(_ d: String) -> NSBezierPath {
        let path = NSBezierPath()
        var nums: [CGFloat] = []
        var cmd: Character = "M"
        var cur = NSPoint.zero, start = NSPoint.zero
        func flush() {
            var i = 0
            func take(_ n: Int) -> [CGFloat]? { guard i + n <= nums.count else { return nil }; defer { i += n }; return Array(nums[i..<i + n]) }
            let rel = cmd.isLowercase
            switch cmd.lowercased() {
            case "m":
                var first = true
                while let v = take(2) {
                    let p = rel ? NSPoint(x: cur.x + v[0], y: cur.y + v[1]) : NSPoint(x: v[0], y: v[1])
                    if first { path.move(to: p); start = p; first = false } else { path.line(to: p) }
                    cur = p
                }
            case "l":
                while let v = take(2) { cur = rel ? NSPoint(x: cur.x + v[0], y: cur.y + v[1]) : NSPoint(x: v[0], y: v[1]); path.line(to: cur) }
            case "h":
                while let v = take(1) { cur = NSPoint(x: rel ? cur.x + v[0] : v[0], y: cur.y); path.line(to: cur) }
            case "v":
                while let v = take(1) { cur = NSPoint(x: cur.x, y: rel ? cur.y + v[0] : v[0]); path.line(to: cur) }
            case "c":
                while let v = take(6) {
                    let o = rel ? cur : .zero
                    let c1 = NSPoint(x: o.x + v[0], y: o.y + v[1]), c2 = NSPoint(x: o.x + v[2], y: o.y + v[3]), p = NSPoint(x: o.x + v[4], y: o.y + v[5])
                    path.curve(to: p, controlPoint1: c1, controlPoint2: c2); cur = p
                }
            case "z":
                path.close(); cur = start
            default: break
            }
            nums.removeAll()
        }
        var token = ""
        func pushNum() { if let n = Double(token) { nums.append(CGFloat(n)) }; token = "" }
        for ch in d {
            if ch.isLetter && ch != "e" {
                pushNum(); flush(); cmd = ch
            } else if ch == "-" {
                if !token.isEmpty && !token.hasSuffix("e") { pushNum() }
                token.append(ch)
            } else if ch == "." {
                if token.contains(".") { pushNum() }
                token.append(ch)
            } else if ch == " " || ch == "," {
                pushNum()
            } else {
                token.append(ch)
            }
        }
        pushNum(); flush()
        return path
    }

}
