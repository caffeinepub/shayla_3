import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import WaterFillAnimation from './WaterFillAnimation';
import { playChime } from '../utils/audioGenerator';

const CYCLE_SECONDS = 60;
const LOGO_WIDTH = 260;
const LOGO_HEIGHT = 72;

export default function Header() {
  const navigate = useNavigate();
  const router = useRouter();

  const currentPath = router.state.location.pathname;
  const isHome = currentPath === '/';

  // Track current second in the 60-second cycle
  const [second, setSecond] = useState(0);
  const secondRef = useRef(0);
  const audioUnlockedRef = useRef(false);

  // Unlock audio context on first user interaction
  const unlockAudio = useCallback(() => {
    if (!audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [unlockAudio]);

  useEffect(() => {
    const interval = setInterval(() => {
      secondRef.current += 1;

      if (secondRef.current >= CYCLE_SECONDS) {
        secondRef.current = 0;
        // Play chime synchronized with water reset
        playChime();
      }

      setSecond(secondRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3 border-b border-gold/20 bg-navy/80 backdrop-blur-sm">
      {/* Back button */}
      <div className="flex items-center gap-3">
        {!isHome && (
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-1 text-gold hover:text-gold-light transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>بازگشت</span>
          </button>
        )}
      </div>

      {/* Animated Shayla Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div
          className="shayla-logo-container"
          style={{
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            position: 'relative',
          }}
        >
          {/* Water fill canvas behind text */}
          <WaterFillAnimation
            second={second}
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
          />

          {/* Carved ivory text floating above water */}
          <div
            className="shayla-carved-text"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <span className="shayla-text">Shayla</span>
          </div>

          {/* Subtle border glow around container */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '0.5rem',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.15), inset 0 0 8px rgba(56, 189, 248, 0.05)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        </div>
      </div>

      {/* Right side placeholder */}
      <div className="w-16" />
    </header>
  );
}
