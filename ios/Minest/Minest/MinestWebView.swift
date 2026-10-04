import SwiftUI
import WebKit

/// Highly optimized WKWebView host for Minest SPA with shared process pool and pre-warming
public struct MinestWebView: UIViewRepresentable {
    public let url: URL
    public let bridge: MinestBridge
    public var onFinishLoading: (() -> Void)?
    
    /// Global shared process pool across all WebViews to maximize JIT compilation reuse and speed
    public static let sharedProcessPool = WKProcessPool()
    private static var prewarmedWebView: WKWebView?
    
    /// Pre-warm WebKit subsystems (JIT, Networking, GPU process) at app launch
    public static func prewarm() {
        DispatchQueue.main.async {
            guard prewarmedWebView == nil else { return }
            let config = WKWebViewConfiguration()
            config.processPool = sharedProcessPool
            config.websiteDataStore = WKWebsiteDataStore.default()
            let wv = WKWebView(frame: .zero, configuration: config)
            wv.loadHTMLString("<html><body></body></html>", baseURL: nil)
            prewarmedWebView = wv
            print("⚡️ [MinestWebView] WebKit process pool pre-warmed successfully")
        }
    }
    
    public init(url: URL, bridge: MinestBridge = MinestBridge(), onFinishLoading: (() -> Void)? = nil) {
        self.url = url
        self.bridge = bridge
        self.onFinishLoading = onFinishLoading
    }
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    public func makeUIView(context: Context) -> CustomWKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.processPool = Self.sharedProcessPool
        configuration.websiteDataStore = WKWebsiteDataStore.default()
        configuration.suppressesIncrementalRendering = false
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        // 1. Inject native environment variables & prevent pinch-to-zoom
        let scriptSource = """
        window.__isMinestNative = true;
        window.__isFocusboardNative = true;
        window.__minestAppVersion = '18.0';
        
        // Disable viewport pinch zoom for native app feel
        document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
        
        // Native Bridge Helpers
        window.MinestNative = {
            send: function(action, payload) {
                var msg = Object.assign({ action: action }, payload || {});
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.minestBridge) {
                    window.webkit.messageHandlers.minestBridge.postMessage(msg);
                }
            },
            haptic: function(style, sound) {
                this.send('triggerHaptic', { style: style || 'light', sound: !!sound });
            },
            cardAction: function(subAction, data) {
                this.send('cardAction', Object.assign({ subAction: subAction }, data || {}));
            },
            updateChecklist: function(data) {
                this.send('checklistUpdated', data);
            },
            indexCards: function(cards) {
                this.send('indexCards', { cards: cards });
            },
            share: function(data) {
                this.send('share', data);
            },
            onLowPowerModeChanged: function(isEnabled) {
                if (document.documentElement) {
                    document.documentElement.classList.toggle('low-power-mode', isEnabled);
                }
            },
            onAppLifecycle: function(state) {
                window.__minestAppActive = (state === 'active');
            },
            onDeviceTilt: function(tilt) {
                var rx = (tilt.pitch * 0.35).toFixed(2);
                var ry = (tilt.roll * 0.45).toFixed(2);
                var reflX = (tilt.specularX !== undefined ? tilt.specularX.toFixed(1) : (-tilt.x * 45).toFixed(1)) + 'px';
                var reflY = (tilt.specularY !== undefined ? tilt.specularY.toFixed(1) : (tilt.y * 35).toFixed(1)) + 'px';
                var edgeAngle = (tilt.refractionAngle !== undefined ? tilt.refractionAngle.toFixed(1) : '135.0') + 'deg';
                var shadowX = (tilt.shadowOffsetX !== undefined ? tilt.shadowOffsetX.toFixed(1) : '0.0') + 'px';
                var shadowY = (tilt.shadowOffsetY !== undefined ? tilt.shadowOffsetY.toFixed(1) : '12.0') + 'px';
                var parallaxZ = (tilt.parallaxDepth !== undefined ? tilt.parallaxDepth.toFixed(1) : '0.0') + 'px';
                var parallaxX = (-tilt.x * 2.8).toFixed(2) + 'px';
                var parallaxY = (tilt.y * 2.2).toFixed(2) + 'px';
                
                var root = document.documentElement;
                if (root) {
                    root.style.setProperty('--tilt-rx', rx + 'deg');
                    root.style.setProperty('--tilt-ry', ry + 'deg');
                    root.style.setProperty('--tilt-refl-x', reflX);
                    root.style.setProperty('--tilt-refl-y', reflY);
                    root.style.setProperty('--refl-x', reflX);
                    root.style.setProperty('--refl-y', reflY);
                    root.style.setProperty('--glass-refl-x', reflX);
                    root.style.setProperty('--glass-refl-y', reflY);
                    root.style.setProperty('--glass-edge-angle', edgeAngle);
                    root.style.setProperty('--glass-shadow-x', shadowX);
                    root.style.setProperty('--glass-shadow-y', shadowY);
                    root.style.setProperty('--glass-parallax-z', parallaxZ);
                    root.style.setProperty('--glass-parallax-x', parallaxX);
                    root.style.setProperty('--glass-parallax-y', parallaxY);
                }
                
                var stages = document.querySelectorAll('.perspective-stage, .perspective-drill');
                stages.forEach(function(st) {
                    st.style.setProperty('--inspect-rx', rx + 'deg');
                    st.style.setProperty('--inspect-ry', ry + 'deg');
                    st.style.setProperty('--refl-x', reflX);
                    st.style.setProperty('--refl-y', reflY);
                    st.style.setProperty('--glass-refl-x', reflX);
                    st.style.setProperty('--glass-refl-y', reflY);
                    st.style.setProperty('--glass-edge-angle', edgeAngle);
                    st.style.setProperty('--glass-shadow-x', shadowX);
                    st.style.setProperty('--glass-shadow-y', shadowY);
                });
            },
            onShakeToDraw: function() {
                window.dispatchEvent(new CustomEvent('minestShakeToDraw'));
                
                var banner = document.getElementById('minest-shake-hud');
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'minest-shake-hud';
                    banner.style.cssText = 'position:fixed; top:64px; left:50%; transform:translateX(-50%) translateY(-20px) scale(0.9); background:linear-gradient(135deg, rgba(52,211,153,0.95), rgba(34,211,238,0.95)); color:#061014; font-weight:800; font-size:13px; padding:8px 20px; border-radius:999px; z-index:99999; box-shadow:0 12px 32px rgba(0,0,0,0.6); pointer-events:none; transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); opacity:0; letter-spacing:0.5px;';
                    banner.innerHTML = '🎴 摇一摇抽卡 · 随机抽取学习';
                    document.body.appendChild(banner);
                }
                requestAnimationFrame(function() {
                    banner.style.opacity = '1';
                    banner.style.transform = 'translateX(-50%) translateY(0) scale(1.04)';
                    setTimeout(function() {
                        banner.style.opacity = '0';
                        banner.style.transform = 'translateX(-50%) translateY(-16px) scale(0.92)';
                    }, 1400);
                });
            },
            createCard: function(cardData) {
                try {
                    var boardsRaw = localStorage.getItem('focusboard_boards_v7_2') || localStorage.getItem('focusboard_data');
                    if (boardsRaw) {
                        var boards = JSON.parse(boardsRaw);
                        if (boards && boards.length > 0) {
                            var targetBoard = boards[0];
                            if (cardData.category) {
                                var found = boards.find(function(b) {
                                    return b.title === cardData.category || b.id === cardData.category || (b.name && b.name === cardData.category);
                                });
                                if (found) targetBoard = found;
                            }
                            var lists = targetBoard.lists || targetBoard.columns || [];
                            if (lists.length > 0) {
                                var targetList = lists[0];
                                var newCard = {
                                    id: cardData.id || ('c_' + Date.now()),
                                    title: cardData.title,
                                    description: cardData.initialTask || '',
                                    checklist: cardData.initialTask ? [{ id: 'chk_' + Date.now(), text: cardData.initialTask, done: false }] : [],
                                    createdAt: Date.now()
                                };
                                targetList.cards = targetList.cards || [];
                                targetList.cards.unshift(newCard);
                                localStorage.setItem('focusboard_boards_v7_2', JSON.stringify(boards));
                                window.dispatchEvent(new Event('storage'));
                                window.dispatchEvent(new CustomEvent('minestBoardUpdated', { detail: boards }));
                            }
                        }
                    }
                } catch(e) {
                    console.error('Error inserting Siri card:', e);
                }
                
                var banner = document.getElementById('minest-siri-hud');
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'minest-siri-hud';
                    banner.style.cssText = 'position:fixed; top:64px; left:50%; transform:translateX(-50%) translateY(-20px) scale(0.9); background:linear-gradient(135deg, rgba(52,211,153,0.95), rgba(34,211,238,0.95)); color:#061014; font-weight:800; font-size:13px; padding:10px 22px; border-radius:999px; z-index:99999; box-shadow:0 12px 32px rgba(0,0,0,0.6); pointer-events:none; transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); opacity:0; letter-spacing:0.5px;';
                    document.body.appendChild(banner);
                }
                banner.innerHTML = '✨ Siri 已新建卡片：「' + cardData.title + '」';
                requestAnimationFrame(function() {
                    banner.style.opacity = '1';
                    banner.style.transform = 'translateX(-50%) translateY(0) scale(1.04)';
                    setTimeout(function() {
                        banner.style.opacity = '0';
                        banner.style.transform = 'translateX(-50%) translateY(-16px) scale(0.92)';
                    }, 2200);
                });
            }
        };

        // Automatic Card Sound & Haptics Event Interceptor
        document.addEventListener('click', function(e) {
            // Check for card flip
            if (e.target.closest('.drill-flipper') || e.target.closest('.coverflow-flipper') || e.target.closest('.perspective-drill')) {
                window.MinestNative.cardAction('flip');
                return;
            }
            // Check for mastery rating buttons
            var btn = e.target.closest('button');
            if (btn && btn.textContent) {
                var txt = btn.textContent;
                if (txt.includes('Struggled') || txt.includes('Reset')) {
                    window.MinestNative.cardAction('rate', { level: 1 });
                } else if (txt.includes('Hesitated') || txt.includes('Review')) {
                    window.MinestNative.cardAction('rate', { level: 2 });
                } else if (txt.includes('Mastered')) {
                    window.MinestNative.cardAction('rate', { level: 5 });
                }
            }
        }, true);
        """
        let injectScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        configuration.userContentController.addUserScript(injectScript)
        
        // 2. Attach Bridge handlers
        configuration.userContentController.add(bridge, name: MinestBridge.primaryHandlerName)
        configuration.userContentController.add(bridge, name: MinestBridge.legacyHandlerName)
        
        let webView = CustomWKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif
        
        // Dark theme background matching Minest #0b1117
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 11/255, green: 17/255, blue: 23/255, alpha: 1.0)
        webView.scrollView.backgroundColor = webView.backgroundColor
        
        // Native scroll behavior
        webView.scrollView.bounces = true
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.keyboardDismissMode = .onDrag
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Disable page zoom
        webView.scrollView.minimumZoomScale = 1.0
        webView.scrollView.maximumZoomScale = 1.0
        webView.scrollView.zoomScale = 1.0
        
        // Disable SPA back/forward swipe flash
        webView.allowsBackForwardNavigationGestures = false
        
        // Link bridge reference
        bridge.webView = webView
        
        // Initial load
        context.coordinator.load(url: url, in: webView)
        
        return webView
    }
    
    public func updateUIView(_ uiView: CustomWKWebView, context: Context) {
        // Prevent duplicate reloads on SwiftUI state changes
    }
    
    public static func dismantleUIView(_ uiView: CustomWKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: MinestBridge.primaryHandlerName)
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: MinestBridge.legacyHandlerName)
    }
    
    // MARK: - Coordinator
    public final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: MinestWebView
        private var hasLoadedOnce = false
        
        init(_ parent: MinestWebView) {
            self.parent = parent
        }
        
        public func load(url: URL, in webView: WKWebView) {
            guard !hasLoadedOnce else { return }
            hasLoadedOnce = true
            
            if url.isFileURL {
                print("📁 [MinestWebView] Loading file URL directly: \(url.path)")
                webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
            } else {
                print("🌐 [MinestWebView] Loading remote URL: \(url.absoluteString)")
                var request = URLRequest(url: url)
                request.cachePolicy = .useProtocolCachePolicy
                webView.load(request)
            }
        }
        
        // MARK: - Safe External Link Handling
        public func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }
            
            // Allow initial file loads and local origins
            if url.isFileURL || url.absoluteString.hasPrefix("about:") {
                decisionHandler(.allow)
                return
            }
            
            // Handle external links (open in Safari or system app)
            if navigationAction.navigationType == .linkActivated {
                if url.scheme == "http" || url.scheme == "https" {
                    // Check if link is outside local app
                    decisionHandler(.cancel)
                    print("🌐 [MinestWebView] Opening external link in Safari: \(url.absoluteString)")
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                    return
                } else if url.scheme == "mailto" || url.scheme == "tel" || url.scheme == "sms" {
                    decisionHandler(.cancel)
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                    return
                }
            }
            
            decisionHandler(.allow)
        }
        
        // Handle window.open links
        public func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
            return nil
        }
        
        public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("🚀 [MinestWebView] Finished loading successfully")
            if let customView = webView as? CustomWKWebView {
                customView.injectSafeAreaInsets()
            }
            parent.onFinishLoading?()
        }
        
        public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("❌ [MinestWebView] Navigation error: \(error.localizedDescription)")
            parent.onFinishLoading?()
        }
        
        public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            print("❌ [MinestWebView] Provisional navigation error: \(error.localizedDescription)")
            fallback(in: webView)
            parent.onFinishLoading?()
        }
        
        // MARK: - WKWebContentProcess Termination Recovery (Memory Crash Handling)
        // 32.1: Heads Up reads the gyroscope through DeviceOrientationEvent.
        // Our own bundled page is trusted, so grant motion access without a prompt.
        @available(iOS 15.0, *)
        public func webView(
            _ webView: WKWebView,
            requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }

        public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            print("⚠️ [MinestWebView] WebContent process terminated by system! Reloading smoothly...")
            webView.reload()
        }
        
        private func fallback(in webView: WKWebView) {
            if let bundlePath = (UIDevice.current.userInterfaceIdiom == .pad ? Bundle.main.url(forResource: "ipad", withExtension: "html") : nil) ?? Bundle.main.url(forResource: "iphone18.0", withExtension: "html") ?? Bundle.main.url(forResource: "iphone13.9", withExtension: "html") ?? Bundle.main.url(forResource: "iphone13.2", withExtension: "html") ?? Bundle.main.url(forResource: "iphone", withExtension: "html") ?? Bundle.main.url(forResource: "iphone18.0.html", withExtension: nil) {
                print("🔄 [MinestWebView] Falling back to local bundle: \(bundlePath)")
                webView.loadFileURL(bundlePath, allowingReadAccessTo: bundlePath.deletingLastPathComponent())
            } else if let fallbackURL = URL(string: "https://minest-app.vercel.app/iphone.html") {
                print("🔄 [MinestWebView] Falling back to remote production URL: \(fallbackURL)")
                webView.load(URLRequest(url: fallbackURL))
            }
        }
    }
}

// MARK: - Custom WKWebView with Safe Area Injection
public final class CustomWKWebView: WKWebView {
    public override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        injectSafeAreaInsets()
    }
    
    public override func layoutSubviews() {
        super.layoutSubviews()
        injectSafeAreaInsets()
    }
    
    public func injectSafeAreaInsets() {
        let insets = self.safeAreaInsets
        let js = """
        (function() {
            var root = document.documentElement;
            if (!root) return;
            root.style.setProperty('--sat', '\(insets.top)px');
            root.style.setProperty('--sab', '\(insets.bottom)px');
            root.style.setProperty('--sal', '\(insets.left)px');
            root.style.setProperty('--sar', '\(insets.right)px');
        })();
        """
        self.evaluateJavaScript(js, completionHandler: nil)
    }
}
