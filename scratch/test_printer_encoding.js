const net = require('net');

const PRINTER_IP = '192.168.1.39';
const PRINTER_PORT = 9100;

function sendTcp(payload) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Timeout'));
    });
    
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
    
    socket.connect(PRINTER_PORT, PRINTER_IP, () => {
      socket.write(payload, (err) => {
        socket.destroy();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function run() {
  console.log(`Testing printer connection to ${PRINTER_IP}...`);
  
  // 1. Send Text Mode Test (cp874)
  // Hello World in Thai encoded to TIS-620 / cp874
  // "ทดสอบพิมพ์ภาษาไทย Text Mode"
  // ท = 0xCB, ด = 0xB4, ส = 0xCA, อ = 0xCD, บ = 0xCB
  const textBytes = Buffer.from([
    0x1B, 0x40, // Init
    0x1C, 0x2E, // Cancel Chinese
    0x1B, 0x74, 0x11, // Select Code Page 17 (TIS-620 / cp874)
    // "TEST PRINT TEXT MODE\n"
    0x54, 0x45, 0x53, 0x54, 0x20, 0x50, 0x52, 0x49, 0x4E, 0x54, 0x20, 0x54, 0x45, 0x58, 0x54, 0x20, 0x4D, 0x4F, 0x44, 0x45, 0x0A,
    // "ทดสอบพิมพ์ไทย\n"
    0xCB, 0xB4, 0xCA, 0xCD, 0xCB, 0x70, 0x69, 0x6D, 0x70, 0x68, 0x20, 0x54, 0x68, 0x61, 0x69, 0x0A,
    0x0A, 0x0A, 0x0A, // Feed
    0x1D, 0x56, 0x41, 0x03 // Cut
  ]);
  
  try {
    console.log('Sending Text Mode test print...');
    await sendTcp(textBytes);
    console.log('Text Mode sent successfully!');
  } catch (err) {
    console.error('Text Mode print failed:', err);
  }
  
  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  
  // 2. Send Graphic Mode Test (GS v 0)
  // We'll create a 512x64 black-and-white grid pattern
  const bytesWidth = 512 / 8; // 64 bytes
  const height = 64;
  const bodySize = bytesWidth * height;
  const buffer = Buffer.alloc(12 + bodySize + 7);
  
  let offset = 0;
  buffer[offset++] = 0x1B; buffer[offset++] = 0x40; // Init
  buffer[offset++] = 0x1C; buffer[offset++] = 0x2E; // Cancel Chinese
  
  // GS v 0 0
  buffer[offset++] = 0x1D; buffer[offset++] = 0x76; buffer[offset++] = 0x30; buffer[offset++] = 0x00;
  buffer[offset++] = bytesWidth % 256; buffer[offset++] = Math.floor(bytesWidth / 256);
  buffer[offset++] = height % 256; buffer[offset++] = Math.floor(height / 256);
  
  // Fill grid pattern: horizontal lines every 8th line
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesWidth; x++) {
      if (y % 8 === 0 || x % 4 === 0) {
        buffer[offset++] = 0xFF; // Black pixels
      } else {
        buffer[offset++] = 0x00; // White pixels
      }
    }
  }
  
  // Cut
  buffer[offset++] = 0x0A; buffer[offset++] = 0x0A; buffer[offset++] = 0x0A;
  buffer[offset++] = 0x1D; buffer[offset++] = 0x56; buffer[offset++] = 0x41; buffer[offset++] = 0x03;
  
  try {
    console.log('Sending Graphic Mode (GS v 0) test print...');
    await sendTcp(buffer);
    console.log('Graphic Mode sent successfully!');
  } catch (err) {
    console.error('Graphic Mode print failed:', err);
  }
}

run();
