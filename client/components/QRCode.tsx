import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export default function QRCode({ 
  value, 
  size = 128, 
  bgColor = '#ffffff', 
  fgColor = '#000000' 
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    // Simple QR code generation using canvas
    // For production, use a proper QR library
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Generate simple QR pattern (placeholder - in production use qrcode library)
    const qrSize = 21; // QR code modules
    const moduleSize = size / (qrSize + 8);
    const offset = moduleSize * 4;

    ctx.fillStyle = fgColor;

    // Create a simple deterministic pattern based on the value
    const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Draw finder patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      const s = moduleSize * 7;
      ctx.fillRect(offset + x * moduleSize, offset + y * moduleSize, s, moduleSize);
      ctx.fillRect(offset + x * moduleSize, offset + (y + 6) * moduleSize, s, moduleSize);
      ctx.fillRect(offset + x * moduleSize, offset + y * moduleSize, moduleSize, s);
      ctx.fillRect(offset + (x + 6) * moduleSize, offset + y * moduleSize, moduleSize, s);
      
      ctx.fillRect(offset + (x + 2) * moduleSize, offset + (y + 2) * moduleSize, moduleSize * 3, moduleSize * 3);
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(qrSize - 7, 0);
    drawFinderPattern(0, qrSize - 7);

    // Draw timing patterns
    for (let i = 8; i < qrSize - 8; i += 2) {
      ctx.fillRect(offset + i * moduleSize, offset + 6 * moduleSize, moduleSize, moduleSize);
      ctx.fillRect(offset + 6 * moduleSize, offset + i * moduleSize, moduleSize, moduleSize);
    }

    // Draw data area with pseudo-random pattern based on value
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        // Skip finder patterns
        if ((x < 8 && y < 8) || (x >= qrSize - 8 && y < 8) || (x < 8 && y >= qrSize - 8)) {
          continue;
        }
        // Skip timing patterns
        if (x === 6 || y === 6) continue;

        // Generate pseudo-random pattern
        const seed = (hash + x * 31 + y * 37) % 100;
        if (seed < 45) {
          ctx.fillRect(offset + x * moduleSize, offset + y * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }, [value, size, bgColor, fgColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
