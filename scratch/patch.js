const fs = require('fs');
let code = fs.readFileSync('lib/graphicPrinter.ts', 'utf8');

const oldRenderDirectStart = code.indexOf('const renderGraphicCanvasDirect');
const oldRenderDirectEnd = code.indexOf('export const printGraphicModeCustomerReceipt');

if (oldRenderDirectStart !== -1 && oldRenderDirectEnd !== -1) {
  const newRenderDirect = `const renderGraphicCanvasDirect = async (
  html: string,
  width: number,
  styles = 'padding: 10px 12px; text-align: center; font-size: 20px; font-weight: bold;'
): Promise<HTMLCanvasElement> => {
  const div = document.createElement('div');
  div.style.cssText = \`position: fixed; left: 0; top: 0; opacity: 0.01; pointer-events: none; background: white; color: black; font-family: 'Noto Sans Thai', 'Tahoma', 'Arial', sans-serif; width: \${width}px; box-sizing: border-box; \${styles} z-index: -9999;\`;
  div.innerHTML = html;
  
  document.body.appendChild(div);

  try {
    const canvas = await html2canvas(div, {
      scale: 1,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      removeContainer: true,
      foreignObjectRendering: false,
      imageTimeout: 3000,
    });
    return canvas;
  } finally {
    if (document.body.contains(div)) {
      document.body.removeChild(div);
    }
  }
};

`;
  code = code.substring(0, oldRenderDirectStart) + newRenderDirect + code.substring(oldRenderDirectEnd);
}

// Remove all alerts
code = code.replace(/if\s*\(typeof window !== 'undefined'\)\s*alert\([^)]+\);?\n?/g, '');

// Also add back the try/catch fallback to text mode that was there yesterday!
// But wait, the user said they don't want text mode because Thai is garbled.
// Actually, yesterday's fallback to Text Mode just printed garbled Thai instead of NOTHING. But today I forced graphic mode to throw an error. Let's just leave the throw error so it doesn't print garbled Thai.

fs.writeFileSync('lib/graphicPrinter.ts', code);
console.log('Patched graphicPrinter.ts');
