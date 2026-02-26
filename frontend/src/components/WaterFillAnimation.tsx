import { useEffect, useRef } from 'react';

interface WaterFillAnimationProps {
  /** 0–60: current second in the cycle */
  second: number;
  width: number;
  height: number;
}

export default function WaterFillAnimation({ second, width, height }: WaterFillAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const waveOffsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill percentage: 0 at second=0, 1 at second=60
    const fillPct = second / 60;
    // Water level from bottom (0 = empty, 1 = full)
    const waterY = height * (1 - fillPct);

    let running = true;

    function draw(timestamp: number) {
      if (!running || !ctx) return;

      // Advance wave offset for undulation
      waveOffsetRef.current = timestamp * 0.002;

      ctx.clearRect(0, 0, width, height);

      if (fillPct <= 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Build wave path
      ctx.beginPath();
      ctx.moveTo(0, height);

      const waveAmplitude = Math.max(3, 8 * fillPct);
      const waveFrequency = (2 * Math.PI) / (width * 0.6);

      for (let x = 0; x <= width; x++) {
        const wave1 = Math.sin(x * waveFrequency + waveOffsetRef.current) * waveAmplitude;
        const wave2 = Math.sin(x * waveFrequency * 1.7 - waveOffsetRef.current * 0.8) * (waveAmplitude * 0.5);
        const y = waterY + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      // Water gradient: deep blue at bottom, cyan/teal at top
      const gradient = ctx.createLinearGradient(0, waterY, 0, height);
      gradient.addColorStop(0, `rgba(56, 189, 248, ${0.55 + fillPct * 0.2})`);
      gradient.addColorStop(0.4, `rgba(14, 165, 233, ${0.60 + fillPct * 0.15})`);
      gradient.addColorStop(1, `rgba(3, 105, 161, ${0.70 + fillPct * 0.1})`);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Foam/highlight at wave crest
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const wave1 = Math.sin(x * waveFrequency + waveOffsetRef.current) * waveAmplitude;
        const wave2 = Math.sin(x * waveFrequency * 1.7 - waveOffsetRef.current * 0.8) * (waveAmplitude * 0.5);
        const y = waterY + wave1 + wave2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.5 + fillPct * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Subtle bubble particles
      if (fillPct > 0.05) {
        const bubbleCount = Math.floor(fillPct * 6);
        for (let i = 0; i < bubbleCount; i++) {
          const bx = ((timestamp * 0.03 * (i + 1) * 37) % width);
          const by = waterY + ((timestamp * 0.015 * (i + 1) * 13) % (height - waterY));
          const br = 1.5 + (i % 3);
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(186, 230, 253, 0.4)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [second, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        borderRadius: '0.5rem',
      }}
    />
  );
}
