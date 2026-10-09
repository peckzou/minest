import AppKit
import WebKit

/// Borderless, transparent, non-activating NSPanel for the Desktop Pet companion.
/// It never steals keyboard focus from the user's active applications.
final class DesktopPetPanel: NSPanel {
    // the pet (160 pt) plus room around it for its menu bubbles, tips and inbox — the empty parts
    // let clicks through (see AppDelegate.updateMousePassThrough)
    static let defaultSize: CGFloat = 420.0
    static let defaultHeight: CGFloat = 440.0

    private var initialMouseLocation: NSPoint = .zero
    private var initialWindowOrigin: NSPoint = .zero
    private var isDraggingWindow: Bool = false
    private var dragTimer: Timer?

    init() {
        let rect = NSRect(x: 100, y: 100, width: Self.defaultSize, height: Self.defaultHeight)
        
        super.init(
            contentRect: rect,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        self.isOpaque = false
        self.backgroundColor = .clear
        self.hasShadow = false
        self.ignoresMouseEvents = true   // until the mouse is over the pet
        self.isMovableByWindowBackground = false
        self.isReleasedWhenClosed = false
        self.hidesOnDeactivate = false
        self.becomesKeyOnlyIfNeeded = false

        // Keep visible across virtual desktop spaces and in full-screen spaces
        self.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]

        // Always-on-top window level (Keep Visible by default)
        self.level = .floating
    }

    // MARK: - Focus-Safety Overrides (Requirement 6)
    // Critical: Desktop Pet must never steal keyboard focus while user types in Safari, Notes, Xcode, etc.
    override var canBecomeKey: Bool {
        return false
    }

    override var canBecomeMain: Bool {
        return false
    }

    // MARK: - Dragging & Multi-Display Clamping
    func beginWindowDrag(screenLocation: NSPoint) {
        self.isDraggingWindow = true
        self.initialMouseLocation = NSEvent.mouseLocation
        self.initialWindowOrigin = self.frame.origin

        dragTimer?.invalidate()
        dragTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 60.0, repeats: true) { [weak self] _ in
            guard let self = self, self.isDraggingWindow else { return }
            let currentMouse = NSEvent.mouseLocation
            let dx = currentMouse.x - self.initialMouseLocation.x
            let dy = currentMouse.y - self.initialMouseLocation.y

            let newOrigin = NSPoint(
                x: self.initialWindowOrigin.x + dx,
                y: self.initialWindowOrigin.y + dy
            )
            self.setFrameOriginClamped(newOrigin)
        }
    }

    func endWindowDrag() {
        self.isDraggingWindow = false
        dragTimer?.invalidate()
        dragTimer = nil

        // Save position to UserDefaults
        saveCurrentPosition()
    }

    func setFrameOriginClamped(_ origin: NSPoint) {
        let windowSize = self.frame.size
        let testRect = NSRect(origin: origin, size: windowSize)
        
        // Find screen intersecting the window or default to main
        let activeScreen = NSScreen.screens.first { $0.frame.intersects(testRect) } ?? NSScreen.main ?? NSScreen.screens.first

        if let screen = activeScreen {
            let visible = screen.visibleFrame
            // the pet (not the whole transparent window) has to stay on screen
            let padX = (windowSize.width - 160) / 2 - 10, padTop = windowSize.height * 0.58 - 90, padBottom = windowSize.height * 0.42 - 90
            let clampedX = min(max(origin.x, visible.minX - padX), visible.maxX - windowSize.width + padX)
            let clampedY = min(max(origin.y, visible.minY - padBottom), visible.maxY - windowSize.height + padTop)
            self.setFrameOrigin(NSPoint(x: clampedX, y: clampedY))
        } else {
            self.setFrameOrigin(origin)
        }
    }

    func clampToCurrentScreens() {
        let currentOrigin = self.frame.origin
        let currentRect = self.frame

        // Check if on any valid screen
        let onScreen = NSScreen.screens.contains { $0.frame.intersects(currentRect) }
        if !onScreen, let primary = NSScreen.main {
            // Restore to bottom-right of primary screen
            let safeX = primary.visibleFrame.maxX - Self.defaultSize - 40
            let safeY = primary.visibleFrame.minY + 60
            self.setFrameOrigin(NSPoint(x: safeX, y: safeY))
            saveCurrentPosition()
        } else {
            setFrameOriginClamped(currentOrigin)
        }
    }

    func saveCurrentPosition() {
        let origin = self.frame.origin
        UserDefaults.standard.set(Double(origin.x), forKey: "minest.desktopPet.originX")
        UserDefaults.standard.set(Double(origin.y), forKey: "minest.desktopPet.originY")
        UserDefaults.standard.set(2, forKey: "minest.desktopPet.layout")
    }

    func restoreSavedPosition() {
        let hasX = UserDefaults.standard.object(forKey: "minest.desktopPet.originX") != nil
        let hasY = UserDefaults.standard.object(forKey: "minest.desktopPet.originY") != nil

        if hasX && hasY {
            var savedX = UserDefaults.standard.double(forKey: "minest.desktopPet.originX")
            var savedY = UserDefaults.standard.double(forKey: "minest.desktopPet.originY")
            if UserDefaults.standard.integer(forKey: "minest.desktopPet.layout") < 2 {
                // saved by the 210-pt window: move so the pet stays where it was
                savedX -= (Self.defaultSize - 210) / 2
                savedY -= Self.defaultHeight * 0.42 - 105
                UserDefaults.standard.set(2, forKey: "minest.desktopPet.layout")
            }
            self.setFrameOrigin(NSPoint(x: savedX, y: savedY))
            self.clampToCurrentScreens()
        } else if let mainScreen = NSScreen.main {
            // Default position: comfortable bottom-right of primary screen
            let safeX = mainScreen.visibleFrame.maxX - Self.defaultSize - 50
            let safeY = mainScreen.visibleFrame.minY + 60
            self.setFrameOrigin(NSPoint(x: safeX, y: safeY))
            saveCurrentPosition()
        }
    }
}
