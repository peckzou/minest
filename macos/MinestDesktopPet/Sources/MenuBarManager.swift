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
            button.title = "🐙"
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
        statusItem?.button?.title = connected ? "🐙" : "🐙·"
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
}
