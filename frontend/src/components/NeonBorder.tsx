import { useEffect, useRef, useState } from 'react';

const NEON_COLORS = [
  { name: 'gold', color: '#D4AF37', glow: 'rgba(212,175,55,0.8)' },
  { name: 'violet', color: '#9B59B6', glow: 'rgba(155,89,182,0.8)' },
  { name: 'cyan', color: '#00E5FF', glow: 'rgba(0,229,255,0.8)' },
  { name: 'pink', color: '#FF69B4', glow: 'rgba(255,105,180,0.8)' },
];

export default function NeonBorder() {
  const [colorIndex, setColorIndex] = useState(0);
  const [phase, setPhase] = useState<'running' | 'blink'>('running');
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const LOOP_DURATION = 3000; // ms per full loop
  const BLINK_DURATION = 600;

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const p = Math.min(elapsed / LOOP_DURATION, 1);
      setProgress(p);

      if (p >= 1) {
        setPhase('blink');
        blinkTimeout = setTimeout(() => {
          setColorIndex((prev) => (prev + 1) % NEON_COLORS.length);
          setPhase('running');
          setProgress(0);
          startTimeRef.current = 0;
        }, BLINK_DURATION);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    if (phase === 'running') {
      animRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(blinkTimeout);
    };
  }, [phase, colorIndex]);

  const current = NEON_COLORS[colorIndex];
  const isBlinking = phase === 'blink';

  // Calculate the position of the neon dot along the border
  const getSpotStyle = () => {
    // perimeter: top → right → bottom → left
    const p = progress;
    return {
      '--neon-color': current.color,
      '--neon-glow': current.glow,
      '--neon-progress': p,
    } as React.CSSProperties;
  };

  return (
    <>
      {/* Static border glow */}
      <div
        className="neon-border-frame"
        style={{
          '--neon-color': current.color,
          '--neon-glow': current.glow,
          opacity: isBlinking ? 0.2 : 0.6,
          transition: isBlinking ? 'opacity 0.1s' : 'opacity 0.3s',
        } as React.CSSProperties}
      />
      {/* Moving neon spot */}
      <NeonSpot color={current.color} glow={current.glow} progress={progress} isBlinking={isBlinking} />
    </>
  );
}

function NeonSpot({
  color,
  glow,
  progress,
  isBlinking,
}: {
  color: string;
  glow: string;
  progress: number;
  isBlinking: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (isBlinking) return;

    // Perimeter: top(W) + right(H) + bottom(W) + left(H)
    const perimeter = 2 * (W + H);
    const dist = progress * perimeter;

    let x = 0, y = 0;
    if (dist <= W) {
      x = dist; y = 0;
    } else if (dist <= W + H) {
      x = W; y = dist - W;
    } else if (dist <= 2 * W + H) {
      x = W - (dist - W - H); y = H;
    } else {
      x = 0; y = H - (dist - 2 * W - H);
    }

    // Draw glowing spot
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.3, glow);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Bright core
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [progress, color, glow, isBlinking]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: isBlinking ? 0 : 1, transition: 'opacity 0.15s' }}
    />
  );
}
