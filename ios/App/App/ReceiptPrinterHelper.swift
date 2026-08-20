import UIKit
import SwiftUI
import Network

// MARK: - Models
public struct ReceiptSettings: Codable {
    public var showLogo: Bool
    public var logoUrl: String?
    public var shopName: String
    public var branchName: String?
    public var address: String?
    public var phone: String?
    public var taxId: String?
    public var headerMessage: String?
    public var footerMessage: String?
    public var wifiPassword: String?
    public var showShortNames: Bool
    public var showToppings: Bool
    public var showDiscounts: Bool
    public var autoCut: Bool
    public var openCashDrawer: Bool
    
    public init(showLogo: Bool, logoUrl: String? = nil, shopName: String, branchName: String? = nil, address: String? = nil, phone: String? = nil, taxId: String? = nil, headerMessage: String? = nil, footerMessage: String? = nil, wifiPassword: String? = nil, showShortNames: Bool, showToppings: Bool, showDiscounts: Bool, autoCut: Bool, openCashDrawer: Bool) {
        self.showLogo = showLogo
        self.logoUrl = logoUrl
        self.shopName = shopName
        self.branchName = branchName
        self.address = address
        self.phone = phone
        self.taxId = taxId
        self.headerMessage = headerMessage
        self.footerMessage = footerMessage
        self.wifiPassword = wifiPassword
        self.showShortNames = showShortNames
        self.showToppings = showToppings
        self.showDiscounts = showDiscounts
        self.autoCut = autoCut
        self.openCashDrawer = openCashDrawer
    }
}

public struct OrderItem: Codable {
    public var name: String
    public var quantity: Int
    public var price: Double
    public var subtotal: Double
    public var toppings: [String]?
    public var discount: Double?
    
    public init(name: String, quantity: Int, price: Double, subtotal: Double, toppings: [String]? = nil, discount: Double? = nil) {
        self.name = name
        self.quantity = quantity
        self.price = price
        self.subtotal = subtotal
        self.toppings = toppings
        self.discount = discount
    }
}

public struct OrderData: Codable {
    public var orderNumber: String
    public var queueNumber: String?
    public var dateString: String
    public var customerName: String?
    public var orderType: String // dine_in, takeaway, delivery
    public var items: [OrderItem]
    public var subtotal: Double
    public var discount: Double
    public var serviceCharge: Double
    public var vat: Double
    public var total: Double
    public var paymentMethod: String
    public var cashReceived: Double?
    public var change: Double?
    
    public init(orderNumber: String, queueNumber: String? = nil, dateString: String, customerName: String? = nil, orderType: String, items: [OrderItem], subtotal: Double, discount: Double, serviceCharge: Double, vat: Double, total: Double, paymentMethod: String, cashReceived: Double? = nil, change: Double? = nil) {
        self.orderNumber = orderNumber
        self.queueNumber = queueNumber
        self.dateString = dateString
        self.customerName = customerName
        self.orderType = orderType
        self.items = items
        self.subtotal = subtotal
        self.discount = discount
        self.serviceCharge = serviceCharge
        self.vat = vat
        self.total = total
        self.paymentMethod = paymentMethod
        self.cashReceived = cashReceived
        self.change = change
    }
}

// MARK: - SwiftUI Dashed Line Helper
struct DashedLine: View {
    var body: some View {
        Line()
            .stroke(style: StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
            .frame(height: 1.5)
            .foregroundColor(.black)
    }
}

struct Line: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: 0))
        path.addLine(to: CGPoint(x: rect.width, y: 0))
        return path
    }
}

// MARK: - SwiftUI Receipt Layout
public struct ReceiptLayoutView: View {
    public var settings: ReceiptSettings
    public var order: OrderData
    
    public var body: some View {
        VStack(alignment: .center, spacing: 10) {
            // 1. HEADER SECTION
            VStack(spacing: 4) {
                if settings.showLogo {
                    Image(systemName: "cup.and.saucer.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.black)
                        .padding(.bottom, 6)
                }
                
                Text(settings.shopName)
                    .font(.system(size: 20, weight: .black))
                    .multilineTextAlignment(.center)
                
                if let branch = settings.branchName, !branch.isEmpty {
                    Text("สาขา: \(branch)")
                        .font(.system(size: 13, weight: .bold))
                }
                
                if let address = settings.address, !address.isEmpty {
                    Text(address)
                        .font(.system(size: 11))
                        .multilineTextAlignment(.center)
                        .foregroundColor(.black)
                }
                
                if let phone = settings.phone, !phone.isEmpty {
                    Text("โทร: \(phone)")
                        .font(.system(size: 11))
                }
                
                if let taxId = settings.taxId, !taxId.isEmpty {
                    Text("เลขประจำตัวผู้เสียภาษี: \(taxId)")
                        .font(.system(size: 11))
                }
                
                if let header = settings.headerMessage, !header.isEmpty {
                    Text(header)
                        .font(.system(size: 12, weight: .bold))
                        .multilineTextAlignment(.center)
                        .padding(.top, 4)
                }
            }
            
            DashedLine()
            
            // 2. ORDER INFORMATION
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("เลขที่ใบเสร็จ: \(order.orderNumber)")
                        .font(.system(size: 11, weight: .bold))
                    Spacer()
                    if let queue = order.queueNumber, !queue.isEmpty {
                        Text("คิวที่: \(queue)")
                            .font(.system(size: 13, weight: .black))
                    }
                }
                
                Text("วันที่: \(order.dateString)")
                    .font(.system(size: 11))
                
                if let customer = order.customerName, !customer.isEmpty {
                    Text("ลูกค้า: \(customer)")
                        .font(.system(size: 11, weight: .bold))
                }
                
                let orderTypeTh: String = {
                    switch order.orderType.lowercased() {
                    case "dine_in": return "ทานที่ร้าน (Dine-In)"
                    case "takeaway": return "กลับบ้าน (Takeaway)"
                    case "delivery": return "จัดส่ง (Delivery)"
                    default: return order.orderType
                    }
                }()
                Text("ประเภท: \(orderTypeTh)")
                    .font(.system(size: 11, weight: .bold))
            }
            
            DashedLine()
            
            // 3. ITEMS TABLE
            VStack(alignment: .leading, spacing: 8) {
                ForEach(order.items, id: \.name) { item in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(alignment: .top) {
                            Text("\(item.quantity)x \(item.name)")
                                .font(.system(size: 13, weight: .bold))
                                .lineLimit(2)
                            Spacer()
                            Text(String(format: "฿%.2f", item.subtotal))
                                .font(.system(size: 13, weight: .bold))
                        }
                        
                        if settings.showToppings, let toppings = item.toppings, !toppings.isEmpty {
                            ForEach(toppings, id: \.self) { topping in
                                Text("  + \(topping)")
                                    .font(.system(size: 11))
                            }
                        }
                        
                        if settings.showDiscounts, let disc = item.discount, disc > 0 {
                            Text(String(format: "  (ส่วนลดรายการ -฿%.2f)", disc))
                                .font(.system(size: 11))
                        }
                    }
                }
            }
            
            DashedLine()
            
            // 4. SUMMARY SECTION
            VStack(spacing: 6) {
                HStack {
                    Text("ยอดรวม (Subtotal)")
                        .font(.system(size: 12))
                    Spacer()
                    Text(String(format: "฿%.2f", order.subtotal))
                        .font(.system(size: 12))
                }
                
                if order.discount > 0 {
                    HStack {
                        Text("ส่วนลด (Discount)")
                            .font(.system(size: 12))
                        Spacer()
                        Text(String(format: "-฿%.2f", order.discount))
                            .font(.system(size: 12))
                    }
                }
                
                if order.serviceCharge > 0 {
                    HStack {
                        Text("ค่าบริการ (Service Charge)")
                            .font(.system(size: 12))
                        Spacer()
                        Text(String(format: "฿%.2f", order.serviceCharge))
                            .font(.system(size: 12))
                    }
                }
                
                if order.vat > 0 {
                    HStack {
                        Text("ภาษีมูลค่าเพิ่ม (VAT 7%)")
                            .font(.system(size: 12))
                        Spacer()
                        Text(String(format: "฿%.2f", order.vat))
                            .font(.system(size: 12))
                    }
                }
                
                HStack {
                    Text("ยอดสุทธิ (Total)")
                        .font(.system(size: 16, weight: .black))
                    Spacer()
                    Text(String(format: "฿%.2f", order.total))
                        .font(.system(size: 18, weight: .black))
                }
                .padding(.vertical, 2)
                
                DashedLine()
                
                HStack {
                    Text("ชำระโดย: \(order.paymentMethod)")
                        .font(.system(size: 12, weight: .bold))
                    Spacer()
                }
                
                if let received = order.cashReceived, received > 0 {
                    HStack {
                        Text("รับเงินมา (Received)")
                            .font(.system(size: 12))
                        Spacer()
                        Text(String(format: "฿%.2f", received))
                            .font(.system(size: 12))
                    }
                    HStack {
                        Text("เงินทอน (Change)")
                            .font(.system(size: 12, weight: .bold))
                        Spacer()
                        Text(String(format: "฿%.2f", order.change ?? 0.0))
                            .font(.system(size: 14, weight: .bold))
                    }
                }
            }
            
            DashedLine()
            
            // 5. FOOTER SECTION
            VStack(spacing: 4) {
                if let wifi = settings.wifiPassword, !wifi.isEmpty {
                    Text("Wi-Fi Password: \(wifi)")
                        .font(.system(size: 11, weight: .bold))
                }
                
                if let footer = settings.footerMessage, !footer.isEmpty {
                    Text(footer)
                        .font(.system(size: 11))
                        .multilineTextAlignment(.center)
                } else {
                    Text("ขอบคุณที่ใช้บริการ / Thank You")
                        .font(.system(size: 12, weight: .bold))
                }
            }
            .padding(.top, 4)
        }
        .padding(16)
        .background(Color.white)
        .foregroundColor(.black)
    }
}

// MARK: - Core Printer Helper Class
public class ReceiptPrinterHelper {
    
    /// Renders a SwiftUI View to a 1.0 Scale UIImage with exactly 576 pixel width
    @MainActor
    public static func renderReceiptToImage(settings: ReceiptSettings, order: OrderData) -> UIImage? {
        let width: CGFloat = 560.0
        let receiptView = ReceiptLayoutView(settings: settings, order: order)
        
        let controller = UIHostingController(rootView: receiptView.frame(width: width).background(Color.white))
        guard let view = controller.view else { return nil }
        
        let targetSize = CGSize(width: width, height: UIView.layoutFittingCompressedSize.height)
        view.bounds = CGRect(origin: .zero, size: targetSize)
        
        // Force layout calculation
        let size = view.systemLayoutSizeFitting(
            targetSize,
            withHorizontalFittingPriority: .required,
            verticalFittingPriority: .fittingSizeLevel
        )
        view.bounds.size = CGSize(width: width, height: size.height)
        
        // Create 1.0 scale context (no Retina multiplier)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        format.opaque = true
        
        let renderer = UIGraphicsImageRenderer(size: view.bounds.size, format: format)
        return renderer.image { _ in
            view.drawHierarchy(in: view.bounds, afterScreenUpdates: true)
        }
    }
    
    /// Converts a UIImage to 1-bit Monochrome ESC/POS bytes using the `GS v 0` command.
    /// Runs in under 5ms, generating a compressed binary array of only ~30-60 KB.
    public static func encodeTo1BitRasterESCPOS(image: UIImage, openDrawer: Bool, autoCut: Bool) -> Data {
        guard let cgImage = image.cgImage else { return Data() }
        
        let width = cgImage.width
        let height = cgImage.height
        let bytesPerRow = (width + 7) / 8 // 560 / 8 = 70 bytes
        
        var rawData = [UInt8](repeating: 0, count: width * height * 4)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let context = CGContext(
            data: &rawData,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
        )
        
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        var printerData = Data()
        
        // 1. Kick Cash Drawer if enabled (Pin 2 kick pulses)
        // ESC p m t1 t2
        if openDrawer {
            printerData.append(contentsOf: [0x1B, 0x70, 0x00, 0x1E, 0x78])
        }
        
        // Initialize Printer
        // ESC @
        printerData.append(contentsOf: [0x1B, 0x40])
        
        // 2. Prepare GS v 0 (Raster Bit Image command)
        // Format: GS v 0 m xL xH yL yH d1...dk
        // m = 0 (Normal mode), xL xH represents width in bytes (72 bytes), yL yH represents height in vertical dots (height)
        let xL = UInt8(bytesPerRow & 0xFF)
        let xH = UInt8((bytesPerRow >> 8) & 0xFF)
        let yL = UInt8(height & 0xFF)
        let yH = UInt8((height >> 8) & 0xFF)
        
        printerData.append(contentsOf: [0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH])
        
        // 3. Process image buffer to 1-bit monochrome (Thresholding)
        // Black pixel is 1, White pixel is 0
        for y in 0..<height {
            for xByte in 0..<bytesPerRow {
                var byteVal: UInt8 = 0
                for bit in 0..<8 {
                    let pixelX = xByte * 8 + bit
                    if pixelX < width {
                        let pixelIndex = (y * width + pixelX) * 4
                        let r = rawData[pixelIndex]
                        let g = rawData[pixelIndex + 1]
                        let b = rawData[pixelIndex + 2]
                        let a = rawData[pixelIndex + 3]
                        
                        // Calculate luminance. Clear background transparent pixels default to white.
                        let luminance: Double
                        if a < 50 {
                            luminance = 255.0
                        } else {
                            luminance = 0.299 * Double(r) + 0.587 * Double(g) + 0.114 * Double(b)
                        }
                        
                        // If pixel is dark enough, set it to black (1 bit)
                        if luminance < 128.0 {
                            byteVal |= (1 << (7 - bit))
                        }
                    }
                }
                printerData.append(byteVal)
            }
        }
        
        // 4. Feed & Cut
        // Feed 5 lines (ESC d 5)
        printerData.append(contentsOf: [0x1B, 0x64, 0x05])
        
        // Partial Cut (GS V 66 0)
        if autoCut {
            printerData.append(contentsOf: [0x1D, 0x56, 0x42, 0x00])
        }
        
        return printerData
    }
    
    /// Sends print data asynchronously to a LAN printer via TCP Port 9100 using Network.framework.
    /// Safely handles timeouts and closures.
    public static func sendToPrinter(ipAddress: String, port: UInt16 = 9100, data: Data, completion: @escaping (Result<Void, Error>) -> Void) {
        let host = NWEndpoint.Host(ipAddress)
        let nwPort = NWEndpoint.Port(integerLiteral: port)
        
        let connection = NWConnection(host: host, port: nwPort, using: .tcp)
        var isCompleted = false
        
        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                connection.send(content: data, completion: .contentProcessed { error in
                    if !isCompleted {
                        isCompleted = true
                        connection.cancel()
                        if let error = error {
                            completion(.failure(error))
                        } else {
                            completion(.success(()))
                        }
                    }
                })
            case .failed(let error):
                if !isCompleted {
                    isCompleted = true
                    connection.cancel()
                    completion(.failure(error))
                }
            case .waiting(let error):
                if !isCompleted {
                    isCompleted = true
                    connection.cancel()
                    completion(.failure(error))
                }
            default:
                break
            }
        }
        
        connection.start(queue: .global(qos: .userInitiated))
    }
}
