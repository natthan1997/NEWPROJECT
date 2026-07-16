export const renderGraphicCanvasDirect = async (
  html: string,
  width: number,
  styles = 'padding: 10px 12px; text-align: center; font-size: 20px; font-weight: bold;'
): Promise<HTMLCanvasElement> => {
  const div = document.createElement('div');
  div.style.cssText = `position: fixed; left: 0; top: 0; opacity: 0.01; pointer-events: none; background: white; color: black; font-family: 'Noto Sans Thai', 'Tahoma', 'Arial', sans-serif; width: ${width}px; box-sizing: border-box; ${styles} z-index: -9999;`;
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
