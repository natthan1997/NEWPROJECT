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

        var hasResolved = false

        // Timeout after 5.0 seconds to prevent hanging if IP is unreachable
        let timeoutWorkItem = DispatchWorkItem {
            if !hasResolved {
                hasResolved = true
                connection.cancel()
                call.reject("Connection timed out. IP \(ipAddress) is unreachable or printer is offline.")
            }
        }
        DispatchQueue.global().asyncAfter(deadline: .now() + 5.0, execute: timeoutWorkItem)

        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                let data = self.dataFromHexString(hexData)

                connection.send(content: data, completion: .contentProcessed({ sendError in
                    if let error = sendError {
                        if !hasResolved {
                            hasResolved = true
                            timeoutWorkItem.cancel()
                            call.reject("Send error: \(error)")
                        }
                    } else {
                        if !hasResolved {
                            hasResolved = true
                            timeoutWorkItem.cancel()
                            call.resolve()
                        }
                    }
                    connection.cancel()
                }))
            case .failed(let error):
                if !hasResolved {
                    hasResolved = true
                    timeoutWorkItem.cancel()
                    connection.cancel()
                    call.reject("Connection failed: \(error)")
                }
            case .waiting(let error):
                print("Connection waiting: \(error.localizedDescription)")
            case .cancelled:
                break
            default:
                break
            }
        }

        connection.start(queue: .global())
    }
    
    private func dataFromHexString(_ hexString: String) -> Data {
        let chars = Array(hexString.utf8)
        var data = Data(capacity: chars.count / 2)
        
        var i = 0
        while i < chars.count - 1 {
            let n1 = hexValue(of: chars[i])
            let n2 = hexValue(of: chars[i+1])
            if n1 >= 0 && n2 >= 0 {
                data.append(UInt8((n1 << 4) | n2))
            }
            i += 2
        }
        return data
    }
    
    private func hexValue(of char: UInt8) -> Int {
        switch char {
        case 48...57:  return Int(char - 48) // '0'...'9'
        case 65...70:  return Int(char - 55) // 'A'...'F'
        case 97...102: return Int(char - 87) // 'a'...'f'
        default:       return -1
        }
    }
}
