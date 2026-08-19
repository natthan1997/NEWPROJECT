import SwiftUI
import WebKit
import CoreLocation

struct ContentView: View {
    var body: some View {
        RiderWebView(url: URL(string: "https://101-blush.vercel.app/rider")!)
            .edgesIgnoringSafeArea(.bottom) // Keeps status bar white/red matching design
    }
}

// WKWebView Wrapper for SwiftUI
struct RiderWebView: UIViewRepresentable {
    let url: URL
    
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        
        // Persistent cookie storage
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        
        // Custom user-agent to optionally detect App wrapper
        webView.customUserAgent = "RushUpRiderNativeIOS/1.0"
        
        let request = URLRequest(url: url)
        webView.load(request)
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: RiderWebView
        
        init(_ parent: RiderWebView) {
            self.parent = parent
        }
        
        // Handle JS Alert native popups
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "ตกลง", style: .default, handler: { _ in
                completionHandler()
            }))
            if let rootVC = UIApplication.shared.windows.first?.rootViewController {
                rootVC.present(alert, animated: true, completion: nil)
            } else {
                completionHandler()
            }
        }
        
        // Handle JS Confirm native popups
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "ยกเลิก", style: .cancel, handler: { _ in
                completionHandler(false)
            }))
            alert.addAction(UIAlertAction(title: "ตกลง", style: .default, handler: { _ in
                completionHandler(true)
            }))
            if let rootVC = UIApplication.shared.windows.first?.rootViewController {
                rootVC.present(alert, animated: true, completion: nil)
            } else {
                completionHandler(false)
            }
        }
    }
}
