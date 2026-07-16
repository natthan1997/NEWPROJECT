import Foundation
import Capacitor
import Network

@objc(PrinterSocketPlugin)
public class PrinterSocketPlugin: CAPPlugin {
    @objc func send(_ call: CAPPluginCall) {
        guard let ipAddress = call.getString("ipAddress"),
              let portInt = call.getInt("port"),
              let hexData = call.getString("data") else {
            call.reject("Missing ipAddress, port, or data")
            return
        }

        let port = NWEndpoint.Port(integerLiteral: UInt16(portInt))
        let host = NWEndpoint.Host(ipAddress)
        let connection = NWConnection(host: host, port: port, using: .tcp)

        // Thread-safe flags to prevent double-resolving CAPPluginCall
        var isCompleted = false
        let lock = NSLock()

        // Set up a 5.0 second connection/send timeout
        let timeoutWorkItem = DispatchWorkItem {
            lock.lock()
            defer { lock.unlock() }
            if !isCompleted {
                isCompleted = true
                connection.cancel()
                call.reject("Connection timeout: Could not connect to printer at \(ipAddress):\(portInt) within 5.0 seconds. Please check if the printer is online and connected to the same Wi-Fi subnet.")
            }
        }
        DispatchQueue.global().asyncAfter(deadline: .now() + 5.0, execute: timeoutWorkItem)

        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                // Optimized fast O(N) hex-to-data conversion without quadratic string copying
                var data = Data(capacity: hexData.count / 2)
                var index = hexData.startIndex
                while index < hexData.endIndex {
                    let nextIndex = hexData.index(index, offsetBy: 2, limitedBy: hexData.endIndex) ?? hexData.endIndex
                    let byteString = hexData[index..<nextIndex]
                    if let byte = UInt8(byteString, radix: 16) {
                        data.append(byte)
                    }
                    index = nextIndex
                }

                connection.send(content: data, completion: .contentProcessed({ sendError in
                    lock.lock()
                    defer { lock.unlock() }
                    if !isCompleted {
                        isCompleted = true
                        timeoutWorkItem.cancel()
                        if let error = sendError {
                            call.reject("Send error: \(error)")
                        } else {
                            call.resolve()
                        }
                    }
                    connection.cancel()
                }))
            case .failed(let error):
                lock.lock()
                defer { lock.unlock() }
                if !isCompleted {
                    isCompleted = true
                    timeoutWorkItem.cancel()
                    call.reject("Connection failed: \(error)")
                }
            case .cancelled:
                break
            default:
                break
            }
        }

        connection.start(queue: .global())
    }
}
