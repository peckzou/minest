import SwiftUI
import WebKit

/// SwiftUI wrapper for WKWebView with customized Minest configuration and Swift Bridge
public struct MinestWebView: UIViewRepresentable {
    public let url: URL
    public let bridge: MinestBridge
    
    public init(url: URL, bridge: MinestBridge = MinestBridge()) {
        self.url = url
        self.bridge = bridge
    }
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    public func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        // Inject native identifiers so Web JS knows it is inside the native app
        let injectScript = WKUserScript(
            source: "window.__isMinestNative = true; window.__isFocusboardNative = true; window.__minestAppVersion = '12.8';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(injectScript)
        
        // Attach Swift Bridge handlers (supports both minestBridge and focusboardBridge)
        configuration.userContentController.add(bridge, name: MinestBridge.primaryHandlerName)
        configuration.userContentController.add(bridge, name: MinestBridge.legacyHandlerName)
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif
        
        // Dark background matching Minest #0b1117 theme
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 11/255, green: 17/255, blue: 23/255, alpha: 1.0)
        webView.scrollView.backgroundColor = webView.backgroundColor
        
        // Enable smooth scrolling and bounce
        webView.scrollView.bounces = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Link bridge reference
        bridge.webView = webView
        
        // Load content
        context.coordinator.load(url: url, in: webView)
        
        return webView
    }
    
    public func updateUIView(_ uiView: WKWebView, context: Context) {
        // No-op for live web view
    }
    
    public static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: MinestBridge.primaryHandlerName)
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: MinestBridge.legacyHandlerName)
    }
    
    public final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: MinestWebView
        
        init(_ parent: MinestWebView) {
            self.parent = parent
        }
        
        public func load(url: URL, in webView: WKWebView) {
            if url.isFileURL {
                if let htmlString = try? String(contentsOf: url, encoding: .utf8) {
                    print("📄 [MinestWebView] Loading HTML from memory string (\(htmlString.count) bytes)")
                    webView.loadHTMLString(htmlString, baseURL: url.deletingLastPathComponent())
                } else {
                    print("📁 [MinestWebView] Loading via fileURL: \(url.path)")
                    webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
                }
            } else {
                print("🌐 [MinestWebView] Loading remote URL: \(url.absoluteString)")
                var request = URLRequest(url: url)
                request.cachePolicy = .useProtocolCachePolicy
                webView.load(request)
            }
        }
        
        public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("🚀 [MinestWebView] Web page finished loading: \(webView.url?.absoluteString ?? "inline HTML")")
        }
        
        public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("❌ [MinestWebView] Load failed: \(error.localizedDescription)")
            fallback(in: webView)
        }
        
        public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            print("❌ [MinestWebView] Provisional navigation failed: \(error.localizedDescription)")
            fallback(in: webView)
        }
        
        private func fallback(in webView: WKWebView) {
            if let fallbackURL = URL(string: "https://focusboard-drab.vercel.app") {
                print("🔄 [MinestWebView] Falling back to remote production URL: \(fallbackURL)")
                webView.load(URLRequest(url: fallbackURL))
            }
        }
    }
}
