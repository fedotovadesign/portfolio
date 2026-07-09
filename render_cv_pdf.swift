import AppKit
import Foundation
import WebKit

final class PDFRenderer: NSObject, WKNavigationDelegate {
    private let webView: WKWebView
    private let outputURL: URL
    private let done: (Int32) -> Void

    init(inputURL: URL, outputURL: URL, done: @escaping (Int32) -> Void) {
        self.outputURL = outputURL
        self.done = done
        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 794, height: 1123))
        super.init()
        self.webView.navigationDelegate = self
        self.webView.loadFileURL(inputURL, allowingReadAccessTo: inputURL.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let config = WKPDFConfiguration()
        config.rect = CGRect(x: 0, y: 0, width: 794, height: 1123)

        webView.createPDF(configuration: config) { [self] result in
            switch result {
            case .success(let data):
                do {
                    try data.write(to: outputURL)
                    done(0)
                } catch {
                    fputs("Failed writing PDF: \(error)\n", stderr)
                    done(1)
                }
            case .failure(let error):
                fputs("Failed creating PDF: \(error)\n", stderr)
                done(1)
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        fputs("Navigation failed: \(error)\n", stderr)
        done(1)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        fputs("Provisional navigation failed: \(error)\n", stderr)
        done(1)
    }
}

let args = CommandLine.arguments
guard args.count == 3 else {
    fputs("Usage: render_cv_pdf.swift <input.html> <output.pdf>\nExample: render_cv_pdf.swift \"Fedotova Vera CV Designer.html\" \"UX:UI Designer  Fedotova Vera.pdf\"\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

var exitCode: Int32 = 1
let renderer = PDFRenderer(inputURL: inputURL, outputURL: outputURL) { code in
    exitCode = code
    CFRunLoopStop(CFRunLoopGetMain())
}

_ = renderer
CFRunLoopRun()
exit(exitCode)
