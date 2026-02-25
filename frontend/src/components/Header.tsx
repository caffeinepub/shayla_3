import { useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Menu, X } from 'lucide-react';

export default function Header() {
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  const currentPath = router.state.location.pathname;
  const isHome = currentPath === '/';

  return (
    <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3 border-b border-gold/20 bg-navy/80 backdrop-blur-sm">
      {/* Back button or logo */}
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

      {/* Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        {!imgError ? (
          <img
            src="/assets/generated/shayla-logo.dim_320x120.png"
            alt="شایلا"
            className="h-10 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-bold gold-text-glow tracking-widest" style={{ fontFamily: 'serif' }}>
            شایلا
          </span>
        )}
      </div>

      {/* Right side placeholder for balance */}
      <div className="w-16" />
    </header>
  );
}
