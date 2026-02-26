import type { Platform } from '@/utils/platformFormatters';

interface PlatformSwitcherProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

const platforms: { value: Platform; label: string; emoji: string }[] = [
  { value: 'website', label: 'سایت (دیجی‌فای)', emoji: '🌐' },
  { value: 'instagram', label: 'اینستاگرام', emoji: '📸' },
  { value: 'ita', label: 'ایتا', emoji: '📱' },
  { value: 'blog', label: 'مقاله و بلاگ', emoji: '📄' },
];

export default function PlatformSwitcher({ value, onChange }: PlatformSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-navy/60 border border-gold/20 rounded-xl p-1 flex-wrap">
      {platforms.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            ${value === p.value
              ? 'bg-gold text-navy font-bold shadow-gold-soft'
              : 'text-gold-muted hover:text-gold hover:bg-gold/10'
            }`}
        >
          <span>{p.emoji}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
}
