import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Settings, Sparkles, Package, Handshake } from 'lucide-react';
import ParticleAnimation from '@/components/ParticleAnimation';

interface Tile {
  id: string;
  path: string;
  icon: string;
  fallbackIcon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  isMain?: boolean;
}

const tiles: Tile[] = [
  {
    id: 'content',
    path: '/content',
    icon: '/assets/generated/tile-content-icon.dim_256x256.png',
    fallbackIcon: <Sparkles size={48} className="text-gold" />,
    title: 'تولید محتوا',
    subtitle: 'Content Generator',
    description: 'آنالیز لینک محصول و تولید محتوای سئو‌شده',
    isMain: true,
  },
  {
    id: 'products',
    path: '/products',
    icon: '/assets/generated/tile-products-icon.dim_256x256.png',
    fallbackIcon: <Package size={48} className="text-gold" />,
    title: 'محصولات',
    subtitle: 'Products',
    description: 'مدیریت و بارگذاری محصولات فروشگاه',
  },
  {
    id: 'affiliate',
    path: '/affiliate',
    icon: '/assets/generated/tile-affiliate-icon.dim_256x256.png',
    fallbackIcon: <Handshake size={48} className="text-gold" />,
    title: 'همکاری در فروش',
    subtitle: 'Affiliate Marketing',
    description: 'مدیریت لینک‌های همکاری و کمیسیون',
  },
  {
    id: 'settings',
    path: '/settings',
    icon: '/assets/generated/settings-icon.dim_128x128.png',
    fallbackIcon: <Settings size={48} className="text-gold" />,
    title: 'تنظیمات',
    subtitle: 'Settings',
    description: 'شخصی‌سازی ظاهر و عملکرد برنامه',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [particleActive, setParticleActive] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  const [pendingPath, setPendingPath] = useState('');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleTileClick = (tile: Tile, e: React.MouseEvent) => {
    if (tile.isMain) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setParticleOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setPendingPath(tile.path);
      setParticleActive(true);
    } else {
      navigate({ to: tile.path as '/' });
    }
  };

  const handleParticleComplete = () => {
    setParticleActive(false);
    if (pendingPath) {
      navigate({ to: pendingPath as '/' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-8" dir="rtl">
      <ParticleAnimation
        active={particleActive}
        originX={particleOrigin.x}
        originY={particleOrigin.y}
        onComplete={handleParticleComplete}
      />

      {/* Welcome text */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold gold-text-glow mb-2">خوش آمدید</h1>
        <p className="text-gold-muted text-sm md:text-base">یک بخش را انتخاب کنید</p>
      </div>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl px-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={(e) => handleTileClick(tile, e)}
            className={`tile-card group relative flex flex-col items-center justify-center gap-3 p-6 md:p-8 rounded-2xl border transition-all duration-300 cursor-pointer text-center
              ${tile.isMain
                ? 'border-gold/60 bg-navy-card hover:border-gold hover:shadow-gold-glow col-span-2 md:col-span-1'
                : 'border-gold/20 bg-navy-card hover:border-gold/50 hover:shadow-gold-soft'
              }`}
          >
            {tile.isMain && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs">
                اصلی
              </div>
            )}

            {/* Icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              {!imgErrors[tile.id] ? (
                <img
                  src={tile.icon}
                  alt={tile.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={() => setImgErrors((prev) => ({ ...prev, [tile.id]: true }))}
                />
              ) : (
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {tile.fallbackIcon}
                </div>
              )}
            </div>

            {/* Text */}
            <div>
              <h2 className="text-gold font-bold text-lg md:text-xl">{tile.title}</h2>
              <p className="text-gold-muted text-xs mt-0.5">{tile.subtitle}</p>
              <p className="text-foreground/60 text-xs mt-2 leading-relaxed">{tile.description}</p>
            </div>

            {/* Hover glow overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 70%)' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
