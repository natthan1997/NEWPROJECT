import Foundation
import Capacitor
import Network

@objc(PrinterSocketPlugin)
public class PrinterSocketPlugin: CAPPlugin {
    
    @objc func send(_ call: CAPPluginCall) {
        guard let ip = call.getString("ipAddress"),
              let port = call.getInt("port"),
              let hexString = call.getString("data") else {
            call.reject("Missing ipAddress, port, or data")
            return
        }
        
        let data = dataFromHexString(hexString)
        
        let host = NWEndpoint.Host(ip)
        let nwPort = NWEndpoint.Port(integerLiteral: UInt16(port))
        
        let connection = NWConnection(host: host, port: nwPort, using: .tcp)
        
        var hasResolved = false
        
        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                connection.send(content: data, completion: .contentProcessed { error in
                    if let error = error {
                        if !hasResolved {
                            hasResolved = true
                            connection.cancel()
                            call.reject("Failed to send data: \(error.localizedDescription)")
                        }
                    } else {
                        if !hasResolved {
                            hasResolved = true
                            connection.cancel()
                            call.resolve()
                        }
                    }
                })
            case .failed(let error):
                if !hasResolved {
                    hasResolved = true
                    connection.cancel()
                    call.reject("Connection failed: \(error.localizedDescription)")
                }
            case .waiting(let error):
                // Log and wait for the connection to transition to .ready or .failed
                print("Connection waiting: \(error.localizedDescription)")
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
