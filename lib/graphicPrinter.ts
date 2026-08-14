import html2canvas from 'html2canvas';
import { formatOrderNumber, getPOSOrderPrefix } from './posOrderIdentity';
import {
  PrintOrderData,
  PrintShopData,
  PrintZReportData,
  printCanvasViaEscPos,
  printOpenDrawer,
} from './printerUtils';

const escapeHtml = (value: string) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const formatOrderTypeLabel = (orderType?: string) => {
  if (!orderType) return '-';
  if (orderType === 'dine-in' || orderType === 'dine_in') return 'ทานที่ร้าน (Dine-In)';
  if (orderType === 'takeaway') return 'สั่งกลับบ้าน (Takeaway)';
  if (orderType === 'delivery') return 'เดลิเวอรี่ (Delivery)';
  return orderType.replace(/_/g, ' ').toUpperCase();
};

const formatDeliveryPlatformLabel = (platform?: string) => {
  if (!platform) return '-';
  return platform.replace(/_/g, ' ').toUpperCase();
};

const extractPickupTime = (comment?: string, pickupTime?: string) => {
  const explicit = String(pickupTime || '').trim();
  if (explicit) return explicit;
  const raw = String(comment || '');
  const pickupMatch = raw.match(/(?:เวลารับ|pickup\s*time)\s*:\s*([^\n]+)/i);
  return pickupMatch?.[1]?.trim() || '';
};

const extractOrderNote = (comment?: string) => {
  const raw = String(comment || '').trim();
  if (!raw) return '';
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(?:เวลารับ|pickup\s*time)\s*:/i.test(line))
    .join('\n');
};

const formatModifierLabel = (modifier: any) => {
  if (!modifier) return '';
  const name = modifier.display_name || modifier.label || modifier.group_name || modifier.name || 'Option';
  const value = modifier.value || modifier.selected_value || modifier.option_value || modifier.option_name || '';
  if ((modifier.is_note || name === 'หมายเหตุ') && value) return `หมายเหตุ: ${value}`;
  if (value && value !== name) return `${name}: ${value}`;
  if (modifier.price && Number(modifier.price) !== 0) return `${name} (+${formatCurrency(Number(modifier.price))})`;
  return name;
};

const getPrintedModifierLines = (item: { modifiers?: string[]; selected_modifiers?: any[] }) => {
  if (Array.isArray(item.selected_modifiers) && item.selected_modifiers.length > 0) {
    return item.selected_modifiers.map(formatModifierLabel).filter(Boolean);
  }
  return (item.modifiers || []).filter(Boolean);
};

const formatDateTimeThai = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const pickReceiptStory = (shop: PrintShopData) => {
  const isEnabled = shop.receipt_story_mode === true || String(shop.receipt_story_mode) === 'true';
  const stories = Array.isArray(shop.receipt_stories) ? shop.receipt_stories : [];
  if (!isEnabled || stories.length === 0) return null;
  return stories[Math.floor(Math.random() * stories.length)];
};

const normalizePaymentMethod = (method?: string) => String(method || '').trim().toLowerCase();

const getOrderRefNum = (order: PrintOrderData, shop: PrintShopData) => {
  if (!order.orderNumber || order.orderNumber === 'Draft') return order.orderNumber || '-';
  if (shop.orderNumberFormat) {
    const qNum = parseInt(String(order.queueNumber || '0'), 10) || 0;
    const prefix = getPOSOrderPrefix(order.orderType);
    return formatOrderNumber(shop.orderNumberFormat, prefix, qNum);
  }
  return String(order.orderNumber).slice(-4);
};

const shouldPrintReceiptPaymentQr = (order: PrintOrderData, shop: PrintShopData) => {
  if (!shop.receiptPaymentQrImage) return false;
  const source = normalizePaymentMethod(order.orderSource);
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  return source === 'liff' && order.orderType === 'delivery' && ['cod', 'cash_on_delivery', 'cash-on-delivery'].includes(paymentMethod);
};

const GRAPHIC_RECEIPT_WIDTH = 576;

const renderReceiptHtml = (order: PrintOrderData, shop: PrintShopData) => {
  let html = '';
  const isLarge = shop.receiptFontSize === 'large';
  const itemFontSize = isLarge ? 31 : 27;
  const modifierFontSize = isLarge ? 23 : 21;
  if (shop.receiptHeader) html += `<div style="margin-bottom: 14px; white-space: pre-wrap; line-height:1.45; font-size:25px; text-align:center;">${escapeHtml(shop.receiptHeader)}</div>`;
  html += `<div style="font-size: ${isLarge ? '44px' : '38px'}; margin-bottom: 8px; font-weight: 900; text-align:center; line-height:1.04;">${escapeHtml(shop.name || 'XYLEM LANDSCAPE')}</div>`;
  if (shop.branch) html += `<div style="margin-bottom: 4px; text-align:center; font-size:23px; line-height:1.3;">สาขา: ${escapeHtml(shop.branch)}</div>`;
  if (shop.taxId) html += `<div style="margin-bottom: 4px; text-align:center; font-size:22px; line-height:1.3;">TAX ID: ${escapeHtml(shop.taxId)}</div>`;
  if (shop.address) html += `<div style="margin-bottom: 4px; white-space: pre-wrap; text-align:center; font-size:22px; line-height:1.35;">${escapeHtml(shop.address)}</div>`;
  if (shop.phone) html += `<div style="margin-bottom: 14px; text-align:center; font-size:23px; line-height:1.3;">โทร: ${escapeHtml(shop.phone)}</div>`;

  html += `<div style="border-top: 3px dashed black; margin: 14px 0;"></div>`;
  html += `<div style="text-align:center; font-size:21px; margin-bottom: 8px; line-height:1.25;">วันที่: ${escapeHtml(order.date ? String(order.date).split(',')[0] : '')}</div>`;
  html += `<div style="font-size: 22px; margin-bottom: 7px; line-height:1.25;">รหัสบิล: ${escapeHtml(order.orderNumber)}</div>`;
  html += `<div style="font-size: 22px; margin-bottom: 7px; line-height:1.25;">พนักงาน: ${escapeHtml(order.staffName || '-')}</div>`;
  if (order.customerName) html += `<div style="font-size: 22px; margin-bottom: 7px; line-height:1.25;">ลูกค้า: ${escapeHtml(order.customerName)}</div>`;
  html += `<div style="font-size: 22px; margin-bottom: 7px; line-height:1.25;">ประเภท: ${escapeHtml(formatOrderTypeLabel(order.orderType))}</div>`;
  if (order.tableNumber) {
    html += `<div style="font-size: 22px; margin-bottom: 7px; line-height:1.25;">โต๊ะ: ${escapeHtml(order.tableNumber)}</div>`;
  }
  if (order.orderType === 'delivery') {
    if (order.deliveryPlatform || order.referenceName) {
      html += `<div style="margin: 14px 0; border:3px solid #000; padding:12px 10px; text-align:center; font-weight: 900;">`;
      html += `<div style="font-size: 16px; letter-spacing: 0.12em; margin-bottom: 6px;">ค่ายเดลิเวอรี่</div>`;
      html += `<div style="font-size: 32px; line-height:1.1; margin-bottom: 6px;">${escapeHtml(formatDeliveryPlatformLabel(order.deliveryPlatform))}</div>`;
      if (order.referenceName) {
        html += `<div style="font-size: 24px; margin-bottom: 2px;">เลข: ${escapeHtml(order.referenceName)}</div>`;
      }
      const qStr = String(order.queueNumber || '').trim();
      if (qStr && qStr !== '0' && qStr !== 'null') {
        html += `<div style="font-size: 28px; margin-top: 6px; border-top: 2px dashed black; padding-top: 6px;">คิวเดลิเวอรี่: ${escapeHtml(qStr)}</div>`;
      }
      const orderRefNum = getOrderRefNum(order, shop);
      html += `<div style="font-size: 28px; margin-top: 6px; border-top: 2px dashed black; padding-top: 6px;">เลขออเดอร์: ${escapeHtml(orderRefNum)}</div>`;
      
      if (order.deliveryFee && Number(order.deliveryFee) > 0) {
        html += `<div style="font-size: 22px; margin-top: 4px;">ค่าส่ง: ${formatCurrency(Number(order.deliveryFee))}</div>`;
      }
      html += `</div>`;
    }
  } else {
    const qStr = String(order.queueNumber || '').trim();
    const orderRefNum = getOrderRefNum(order, shop);

    html += `<div style="margin: 14px 0; border:3px solid #000; padding:12px 10px; text-align:center; font-weight: 900;">`;
    if (qStr && qStr !== '0' && qStr !== 'null') {
      html += `<div style="font-size: 16px; letter-spacing: 0.12em; margin-bottom: 6px;">คิวที่ (QUEUE)</div>`;
      html += `<div style="font-size: 48px; line-height:1.05;">#${escapeHtml(qStr.padStart(3, '0'))}</div>`;
      html += `<div style="font-size: 20px; line-height:1.05; margin-top: 6px;">เลขออเดอร์: ${escapeHtml(orderRefNum)}</div>`;
    } else {
      html += `<div style="font-size: 16px; letter-spacing: 0.12em; margin-bottom: 6px;">เลขออเดอร์ (ORDER)</div>`;
      html += `<div style="font-size: 48px; line-height:1.05;">#${escapeHtml(orderRefNum)}</div>`;
    }
    html += `</div>`;
  }

  html += `<div style="border-top: 3px dashed black; margin: 14px 0;"></div>`;
  html += `<div style="line-height: 1.38; text-align:left;">`;
  order.items.forEach((item) => {
    const price = item.subtotal !== undefined ? formatCurrency(item.subtotal) : '';
    html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:${itemFontSize}px; font-weight:900; line-height:1.25; margin-bottom:4px;"><span style="max-width:440px;">${escapeHtml(`${item.quantity}x ${item.name}`)}</span><span style="white-space:nowrap;">${escapeHtml(price)}</span></div>`;
    getPrintedModifierLines(item).forEach((modifier) => {
      html += `<div style="padding-left: 26px; font-weight: 700; color:#222; font-size:${modifierFontSize}px; line-height:1.25; margin-bottom:2px;">- ${escapeHtml(modifier)}</div>`;
    });
  });
  html += `</div>`;

  html += `<div style="border-top: 3px dashed black; margin: 14px 0;"></div>`;
  if (order.discount && order.discount > 0) html += `<div style="display:flex; justify-content:space-between; font-size:23px; line-height:1.35;"><span>ส่วนลด</span><span>-${formatCurrency(order.discount)}</span></div>`;
  if (order.tax && order.tax > 0) html += `<div style="display:flex; justify-content:space-between; font-size:23px; line-height:1.35;"><span>ภาษี</span><span>${formatCurrency(order.tax)}</span></div>`;
  if (order.deliveryFee && Number(order.deliveryFee) > 0) html += `<div style="display:flex; justify-content:space-between; font-size:23px; line-height:1.35;"><span>ค่าส่ง</span><span>${formatCurrency(Number(order.deliveryFee))}</span></div>`;
  html += `<div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; font-size:34px; font-weight:900; margin-top:10px; line-height:1.08;"><span>ยอดรวม</span><span>${formatCurrency(order.total || 0)}</span></div>`;

  if (order.receivedAmount && order.receivedAmount > 0) {
    html += `<div style="border-top: 3px dashed black; margin: 14px 0;"></div>`;
    html += `<div style="display:flex; justify-content:space-between; font-size:23px; line-height:1.35;"><span>รับเงิน (${escapeHtml(order.paymentMethod || 'CASH')})</span><span>${formatCurrency(order.receivedAmount)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; font-size:25px; font-weight:900; line-height:1.3;"><span>เงินทอน</span><span>${formatCurrency(order.changeAmount || 0)}</span></div>`;
  }

  const story = pickReceiptStory(shop);
  if (story) {
    html += `<div style="margin-top: 14px; border-top: 2px dashed #000; padding-top: 12px;">`;
    html += `<div style="text-align:center; font-weight:900; margin-bottom: 8px; font-size:22px;">${escapeHtml(story.title)}</div>`;
    html += `<div style="white-space: pre-wrap; line-height: 1.45; font-size:21px; font-weight:700;">${escapeHtml(story.content)}</div>`;
    html += `</div>`;
  }
  if (shouldPrintReceiptPaymentQr(order, shop)) {
    html += `<div style="margin-top: 16px; border-top: 2px dashed #000; padding-top: 12px; text-align:center;">`;
    html += `<div style="font-size:20px; font-weight:900; margin-bottom: 8px; line-height:1.2;">สแกน QR ชำระเงิน</div>`;
    html += `<div style="display:flex; justify-content:center;"><img src="${escapeHtml(shop.receiptPaymentQrImage || '')}" crossorigin="anonymous" alt="Payment QR" style="width:220px; height:auto; display:block;" /></div>`;
    html += `</div>`;
  }
  if (order.loyaltyClaimQrUrl || order.loyaltyClaimToken) {
    const token = order.loyaltyClaimToken || '';
    const liffId = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi') : '2009322178-2dtfXAvi';
    const qrUrl = order.loyaltyClaimQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`https://liff.line.me/${liffId}/#?path=/member&claimToken=${token}`)}`;
    html += `<div style="margin-top: 16px; border-top: 2px dashed #000; padding-top: 12px; text-align:center;">`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom: 4px; line-height:1.2;">สะสมแต้มผ่าน LINE</div>`;
    html += `<div style="font-size:16px; font-weight:700; margin-bottom: 8px; line-height:1.2;">สแกน QR เพื่อรับแต้มสะสมจากบิลนี้</div>`;
    if (order.pointsEarned && order.pointsEarned > 0) {
      html += `<div style="font-size:18px; font-weight:900; margin-bottom: 6px;">(+${order.pointsEarned} PTS)</div>`;
    }
    html += `<div style="display:flex; justify-content:center;"><img src="${escapeHtml(qrUrl)}" crossorigin="anonymous" alt="Loyalty QR" style="width:200px; height:auto; display:block;" /></div>`;
    html += `</div>`;
  }
  html += `<div style="border-top: 3px dashed black; margin: 14px 0;"></div>`;
  if (shop.receiptFooter) html += `<div style="white-space: pre-wrap; text-align:center; font-size:21px; line-height:1.35;">${escapeHtml(shop.receiptFooter)}</div>`;
  else html += `<div style="white-space: pre-wrap; text-align:center; font-size:21px; line-height:1.35; font-weight:800;">Thank you<br/>Powered by XYL STUDIO</div>`;
  return html;
};

const renderKitchenHtml = (order: PrintOrderData, shop: PrintShopData) => {
  let html = `<div style="text-align:center; font-size: 36px; font-weight: 900; margin-bottom: 12px; border-bottom: 4px solid black; padding-bottom: 10px; margin-top: 5px; line-height:1.05;">ใบสั่งอาหาร</div>`;
  if (shop.kitchenShowType !== false) {
    html += `<div style="text-align:center; font-size: 30px; margin-bottom: 12px; background:black; color:white; padding: 8px 6px; font-weight:900; line-height:1.1;">${escapeHtml(formatOrderTypeLabel(order.orderType))}</div>`;
  }
  html += `<div style="text-align:right; margin-bottom:10px; font-size:23px; font-weight:900; line-height:1.2;">เวลา: ${escapeHtml(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))}</div>`;
  html += `<div style="border: 4px solid black; padding: 14px 10px; margin-bottom: 12px; text-align:center; font-weight: 900;">`;
  if (order.orderType === 'delivery') {
    html += `<div style="font-size: 16px; letter-spacing: 0.14em; margin-bottom: 8px;">ค่ายเดลิเวอรี่</div>`;
    html += `<div style="font-size: 42px; line-height:1.05; margin-bottom: 10px;">${escapeHtml(formatDeliveryPlatformLabel(order.deliveryPlatform))}</div>`;
    html += `<div style="font-size: 15px; letter-spacing: 0.14em; margin-bottom: 6px;">เลข</div>`;
    html += `<div style="font-size: 48px; line-height:1.05; word-break: break-word; margin-bottom: 8px;">${escapeHtml(order.referenceName || '-')}</div>`;
    const qStr = String(order.queueNumber || '').trim();
    if (qStr && qStr !== '0' && qStr !== 'null') {
      html += `<div style="font-size: 32px; border-top: 2px dashed black; padding-top: 8px; margin-top: 4px;">คิวเดลิเวอรี่: ${escapeHtml(qStr)}</div>`;
    }
    const orderRefNum = getOrderRefNum(order, shop);
    html += `<div style="font-size: 32px; border-top: 2px dashed black; padding-top: 8px; margin-top: 4px;">เลขออเดอร์: ${escapeHtml(orderRefNum)}</div>`;
  } else if (order.orderType === 'dine-in' || order.orderType === 'dine_in') {
    html += `<div style="font-size: 16px; letter-spacing: 0.16em; margin-bottom: 8px;">โต๊ะ (TABLE)</div>`;
    html += `<div style="font-size: 72px; line-height: 0.95; word-break: break-word;">${escapeHtml(order.tableNumber || '-')}</div>`;
  } else {
    const qStr = String(order.queueNumber || '').trim();
    const orderRefNum = getOrderRefNum(order, shop);

    if (qStr && qStr !== '0' && qStr !== 'null') {
      html += `<div style="font-size: 18px; letter-spacing: 0.16em; margin-bottom: 8px;">คิวที่ (QUEUE)</div>`;
      html += `<div style="font-size: 54px; line-height: 1.05; word-break: break-word;">#${escapeHtml(qStr.padStart(3, '0'))}</div>`;
      html += `<div style="font-size: 24px; line-height:1.05; margin-top: 12px; font-weight:900;">เลขออเดอร์: ${escapeHtml(orderRefNum)}</div>`;
    } else {
      html += `<div style="font-size: 18px; letter-spacing: 0.16em; margin-bottom: 8px;">เลขออเดอร์ (ORDER)</div>`;
      html += `<div style="font-size: 54px; line-height: 1.05; word-break: break-word;">#${escapeHtml(orderRefNum)}</div>`;
    }
  }
  html += `</div>`;
  html += `<div style="margin-bottom: 8px; font-size: 20px; font-weight:800;">รหัสบิล: ${escapeHtml(order.orderNumber || '-')}</div>`;
  html += `<div style="margin-bottom: 10px; font-size: 22px; font-weight:800;">ประเภท: ${escapeHtml(formatOrderTypeLabel(order.orderType))}</div>`;
  const pickupTime = extractPickupTime(order.comment, order.pickupTime);
  const orderNote = extractOrderNote(order.comment);
  if (pickupTime || orderNote) {
    html += `<div style="border:3px dashed #000; padding:10px 12px; margin-bottom: 12px; font-size:18px; line-height:1.45; font-weight:800;">`;
    html += `<div style="font-size:14px; letter-spacing:0.14em; margin-bottom:6px; text-align:center;">ข้อมูลเพิ่มเติม</div>`;
    if (pickupTime) html += `<div style="margin-bottom:4px;">เวลารับ: ${escapeHtml(pickupTime)}</div>`;
    if (orderNote) html += `<div style="white-space:pre-wrap;">${escapeHtml(orderNote)}</div>`;
    html += `</div>`;
  }
  html += `<div style="border-top: 4px dashed black; margin: 14px 0;"></div>`;
  const itemSize = shop.kitchenFontSize === 'huge' ? '44px' : shop.kitchenFontSize === 'large' ? '36px' : '30px';
  const modifierSize = shop.kitchenFontSize === 'huge' ? '32px' : shop.kitchenFontSize === 'large' ? '27px' : '24px';
  html += `<div style="line-height: 1.28;">`;
  order.items.forEach((item) => {
    html += `<div style="display:flex; gap:14px; font-size:${itemSize}; margin-bottom: 12px; align-items:flex-start; font-weight:900;">` +
      `<span style="display:inline-block; font-weight:900; flex-shrink:0;">${escapeHtml(`${item.quantity}x`)}</span>` +
      `<span>${escapeHtml(item.name)}</span></div>`;
    getPrintedModifierLines(item).forEach((modifier) => {
      html += `<div style="padding-left: 56px; font-weight: 800; color: #222; font-size: ${modifierSize}; line-height:1.25; margin-bottom:4px;">- ${escapeHtml(modifier)}</div>`;
    });
  });
  html += `</div>`;
  html += `<div style="border-top: 4px dashed black; margin: 18px 0;"></div>`;
  html += `<div style="text-align:center; font-size: 18px; font-weight: 900;">--- END ---</div>`;
  return html;
};

const renderZReportHtml = (report: PrintZReportData, shop: PrintShopData) => {
  const paymentRows = report.paymentBreakdown?.filter((row) => row.amount > 0) || [];
  const transactionRows = report.transactionBreakdown?.filter((row) => row.amount > 0) || [];
  let html = '';
  html += `<div style="text-align:center; font-size: 38px; font-weight:900; margin-bottom:4px; line-height:1.06;">สรุปยอดประจำกะ</div>`;
  html += `<div style="text-align:center; font-size: 18px; font-weight:900; margin-bottom:14px; line-height:1.1; letter-spacing:0.12em;">DAILY DRAWER SUMMARY</div>`;
  if (shop.name) html += `<div style="text-align:center; font-size:22px; font-weight:900; line-height:1.15;">${escapeHtml(shop.name)}</div>`;
  if (shop.branch) html += `<div style="text-align:center; margin-bottom:10px; font-size:16px; line-height:1.35;">สาขา: ${escapeHtml(shop.branch)}</div>`;
  html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
  html += `<div style="border:2px solid #000; padding:10px 12px; margin-bottom:12px; font-size:16px; line-height:1.45; font-weight:700;">`;
  html += `<div>รหัสกะ: ${escapeHtml(report.shiftId)}</div>`;
  html += `<div>พนักงาน: ${escapeHtml(report.staffName)}</div>`;
  html += `<div>เปิดกะ: ${escapeHtml(formatDateTimeThai(report.openedAt))}</div>`;
  html += `<div>ปิดกะ: ${escapeHtml(formatDateTimeThai(report.closedAt))}</div>`;
  html += `<div>เงินเปิดลิ้นชัก: ฿ ${formatCurrency(report.startCash || 0)}</div>`;
  html += `<div>จำนวนออเดอร์ทั้งหมด: ${report.orderCount ?? 0} ใบ</div>`;
  html += `<div>ออเดอร์เงินสด: ${report.cashOrderCount ?? 0} ใบ</div>`;
  html += `<div>ออเดอร์ไม่รับเงินสด: ${report.nonCashOrderCount ?? 0} ใบ</div>`;
  html += `</div>`;
  html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
  html += `<div style="font-size:24px; font-weight:900; margin-bottom:8px; line-height:1.1;">สรุปรายรับ</div>`;
  html += `<div style="display:grid; gap:8px; margin-bottom:10px;">`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:18px; line-height:1.4; font-weight:700;"><span>เงินสด</span><span>฿ ${formatCurrency(report.cashSales || 0)}</span></div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:18px; line-height:1.4; font-weight:700;"><span>โอนเงิน / QR</span><span>฿ ${formatCurrency(report.transferSales || 0)}</span></div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:18px; line-height:1.4; font-weight:700;"><span>บัตรเครดิต / เดบิต</span><span>฿ ${formatCurrency(report.cardSales || 0)}</span></div>`;
  if ((report.otherSales || 0) > 0) html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>อื่น ๆ</span><span>฿ ${formatCurrency(report.otherSales || 0)}</span></div>`;
  html += `</div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:22px; font-weight:900; margin-top:4px; line-height:1.25; border-top:1px solid #000; padding-top:8px;"><span>ยอดขายรวม</span><span>฿ ${formatCurrency((report.cashSales || 0) + (report.transferSales || 0) + (report.cardSales || 0) + (report.otherSales || 0))}</span></div>`;
  if (report.discountTotal !== undefined) {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">ส่วนลดรวม</div>`;
    html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>ส่วนลดที่ใส่</span><span>฿ ${formatCurrency(report.discountTotal || 0)}</span></div>`;
  }
  if (typeof report.payInTotal === 'number' || typeof report.payOutTotal === 'number') {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">เงินเข้าออกระหว่างกะ</div>`;
    html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>เงินนำเข้า</span><span>฿ ${formatCurrency(report.payInTotal || 0)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>เงินนำออก</span><span>฿ ${formatCurrency(report.payOutTotal || 0)}</span></div>`;
  }
  if (paymentRows.length > 0) {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">สรุปตามช่องทางชำระ</div>`;
    paymentRows.forEach((row) => {
      html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45;"><span>${escapeHtml(row.label)}</span><span>฿ ${formatCurrency(row.amount)}</span></div>`;
    });
  }
  if (transactionRows.length > 0) {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">สรุปนำเงินเข้า-ออก</div>`;
    transactionRows.forEach((row) => {
      html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45;"><span>${escapeHtml(row.label)}</span><span>฿ ${formatCurrency(row.amount)}</span></div>`;
    });
  }
  if (report.transactionsList && report.transactionsList.length > 0) {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">รายละเอียดเงินเข้า-ออก</div>`;
    report.transactionsList.forEach((tx: any) => {
      const prefix = tx.type === 'pay_in' ? '+' : '-';
      html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:16px; line-height:1.45;"><span>${escapeHtml(tx.reason)}</span><span>${prefix}฿ ${formatCurrency(tx.amount || 0)}</span></div>`;
    });
  }
  html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>ยอดเงินคาดว่าควรมี</span><span>฿ ${formatCurrency(report.expectedCash || 0)}</span></div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:17px; line-height:1.45; font-weight:700;"><span>ยอดเงินนับจริง</span><span>฿ ${formatCurrency(report.actualCash || 0)}</span></div>`;
  html += `<div style="display:flex; justify-content:space-between; gap:12px; font-size:22px; font-weight:900; margin-top:4px; line-height:1.3;"><span>${report.difference < 0 ? 'เงินขาด' : report.difference > 0 ? 'เงินเกิน' : 'ยอดต่าง'}</span><span>฿ ${formatCurrency(report.difference || 0)}</span></div>`;
  if (report.notes) {
    html += `<div style="border-top: 2px dashed #000; margin: 10px 0;"></div>`;
    html += `<div style="font-size:22px; font-weight:900; margin-bottom:4px; line-height:1.15;">หมายเหตุ</div>`;
    html += `<div style="white-space: pre-wrap; line-height:1.45; font-size:17px;">${escapeHtml(report.notes)}</div>`;
  }
  html += `<div style="border-top: 2px dashed #000; margin: 12px 0;"></div>`;
  html += `<div style="text-align:center; font-size:18px; font-weight:900; line-height:1.2;">ขอบคุณครับ</div>`;
  html += `<div style="text-align:center; font-size:15px; font-weight:700; margin-top:2px; line-height:1.2;">THANK YOU</div>`;
  return html;
};

const renderGraphicCanvasDirect = async (
  html: string,
  width: number,
  styles = 'padding: 10px 12px; text-align: center; font-size: 20px; font-weight: bold;'
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${width}px; height: 100vh; border: none; z-index: -9999;`;
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return reject(new Error('Cannot access iframe document'));
    }

    const checkAndRender = async () => {
      try {
        // Allow time for fonts and images to load inside iframe
        await new Promise(r => setTimeout(r, 600));
        
        const contentDiv = doc.getElementById('receipt-content');
        if (!contentDiv) throw new Error('Content div not found in iframe');

        const canvas = await html2canvas(contentDiv, {
          scale: 1,
          backgroundColor: '#FFFFFF',
          useCORS: true,
          logging: true,
          windowWidth: width,
          window: iframe.contentWindow || window, // CRITICAL: Prevent cloning main document
          ignoreElements: (element) => {
            // Prevent WebKit WEBP err=-50 crash by ignoring any image outside our content
            if ((element.tagName === 'IMG' || element.tagName === 'img') && !contentDiv.contains(element)) {
              return true;
            }
            return false;
          }
        });
        resolve(canvas);
      } catch (err) {
        console.error('html2canvas iframe render failed:', err);
        reject(err);
      } finally {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };

    // Assign onload BEFORE doc.write to prevent race conditions on second prints
    iframe.onload = () => {
      checkAndRender();
    };

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700;900&display=swap');
            body {
              margin: 0;
              background: white;
              color: black;
              font-family: 'Noto Sans Thai', 'Tahoma', 'Arial', sans-serif;
              width: ${width}px;
              box-sizing: border-box;
              ${styles}
            }
          </style>
        </head>
        <body>
          <div id="receipt-content">${html}</div>
        </body>
      </html>
    `);
    doc.close();
  });
};

export const printGraphicModeCustomerReceipt = async (
  ip: string,
  order: PrintOrderData,
  shop: PrintShopData,
  model = 'xprinter-xp-n160ii',
  encoding = 'graphic',
  openDrawer = false
) => {
  try {
    const html = renderReceiptHtml(order, shop);
    const canvas = await renderGraphicCanvasDirect(
      html,
      GRAPHIC_RECEIPT_WIDTH,
      'padding: 10px 12px; text-align: center; font-size: 20px; font-weight: bold;'
    );
    const success = await printCanvasViaEscPos(ip, canvas);
    if (openDrawer) await printOpenDrawer(ip);
    return success;
  } catch (error) {
    console.error('Graphic Mode Receipt Print failed:', error);
    throw error;
  }
};

export const printGraphicModeKitchenTicket = async (
  ip: string,
  order: PrintOrderData,
  shop: PrintShopData,
  model = 'xprinter-xp-n160ii',
  encoding = 'graphic'
) => {
  try {
    const html = renderKitchenHtml(order, shop);
    const canvas = await renderGraphicCanvasDirect(
      html,
      GRAPHIC_RECEIPT_WIDTH,
      'padding: 12px 14px; text-align: left; font-size: 20px; font-weight: bold;'
    );
    return await printCanvasViaEscPos(ip, canvas);
  } catch (error) {
    console.error('Graphic Mode Kitchen Ticket Print failed:', error);
    throw error;
  }
};

export const printGraphicModeZReport = async (
  ip: string,
  report: PrintZReportData,
  shop: PrintShopData,
  model = 'xprinter-xp-n160ii',
  encoding = 'graphic'
) => {
  try {
    const html = renderZReportHtml(report, shop);
    const canvas = await renderGraphicCanvasDirect(
      html,
      GRAPHIC_RECEIPT_WIDTH,
      'padding: 12px 14px; text-align: left; font-size: 18px; font-weight: 700;'
    );
    return await printCanvasViaEscPos(ip, canvas);
  } catch (error) {
    console.error('Graphic Mode ZReport Print failed:', error);
    throw error;
  }
};
