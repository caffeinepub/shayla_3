import { useState, useEffect } from 'react';
import { Settings, Save, Palette, FileText, Sliders, Wrench, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGetSettings, useUpdateSettings } from '@/hooks/useSettings';
import type { AppSettings } from '../backend';

const defaultSettings: AppSettings = {
  theme: { accentColor: '#D4AF37', darkMode: true, fontSize: BigInt(16) },
  contentPrefs: { tone: 'professional', language: 'fa', style: 'detailed' },
  defaultPlatform: 'website',
  autoSave: true,
  technical: '',
};

export default function SettingsPage() {
  const { data: savedSettings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const [saved, setSaved] = useState(false);

  // Local form state — initialized from backend data
  const [formSettings, setFormSettings] = useState<AppSettings>(defaultSettings);

  // Sync form state whenever backend data arrives or changes
  useEffect(() => {
    if (savedSettings) {
      setFormSettings(savedSettings);
    }
  }, [savedSettings]);

  const updateTheme = (key: keyof AppSettings['theme'], value: string | boolean | bigint) => {
    setFormSettings((prev) => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
  };

  const updateContentPrefs = (key: keyof AppSettings['contentPrefs'], value: string) => {
    setFormSettings((prev) => ({ ...prev, contentPrefs: { ...prev.contentPrefs, [key]: value } }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formSettings);
      toast.success('تنظیمات با موفقیت ذخیره شد ✓');
      // Show "Saved!" briefly on the button
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('خطا در ذخیره تنظیمات');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-gold-muted text-sm">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Settings size={24} className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gold-text-glow">تنظیمات</h1>
          <p className="text-gold-muted text-sm">شخصی‌سازی ظاهر و عملکرد برنامه</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* UI Theme */}
        <section className="luxury-card p-5">
          <h2 className="text-gold font-semibold flex items-center gap-2 mb-4">
            <Palette size={18} />
            ظاهر و تم
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground/80">حالت تاریک</Label>
              <Switch
                checked={formSettings.theme.darkMode}
                onCheckedChange={(v) => updateTheme('darkMode', v)}
                className="data-[state=checked]:bg-gold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">رنگ اصلی</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formSettings.theme.accentColor}
                  onChange={(e) => updateTheme('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gold/30 cursor-pointer bg-transparent"
                />
                <Input
                  value={formSettings.theme.accentColor}
                  onChange={(e) => updateTheme('accentColor', e.target.value)}
                  className="luxury-input flex-1"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">اندازه فونت: {Number(formSettings.theme.fontSize)}px</Label>
              <Slider
                value={[Number(formSettings.theme.fontSize)]}
                onValueChange={([v]) => updateTheme('fontSize', BigInt(v))}
                min={12}
                max={22}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Content Preferences */}
        <section className="luxury-card p-5">
          <h2 className="text-gold font-semibold flex items-center gap-2 mb-4">
            <FileText size={18} />
            تنظیمات محتوا
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">لحن محتوا</Label>
              <Select value={formSettings.contentPrefs.tone} onValueChange={(v) => updateContentPrefs('tone', v)}>
                <SelectTrigger className="luxury-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy border-gold/30">
                  <SelectItem value="professional">حرفه‌ای</SelectItem>
                  <SelectItem value="friendly">دوستانه</SelectItem>
                  <SelectItem value="formal">رسمی</SelectItem>
                  <SelectItem value="casual">غیررسمی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">زبان محتوا</Label>
              <Select value={formSettings.contentPrefs.language} onValueChange={(v) => updateContentPrefs('language', v)}>
                <SelectTrigger className="luxury-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy border-gold/30">
                  <SelectItem value="fa">فارسی</SelectItem>
                  <SelectItem value="en">انگلیسی</SelectItem>
                  <SelectItem value="fa-en">فارسی + انگلیسی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">سبک محتوا</Label>
              <Select value={formSettings.contentPrefs.style} onValueChange={(v) => updateContentPrefs('style', v)}>
                <SelectTrigger className="luxury-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy border-gold/30">
                  <SelectItem value="detailed">جزئیات کامل</SelectItem>
                  <SelectItem value="concise">خلاصه</SelectItem>
                  <SelectItem value="persuasive">متقاعدکننده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* App Behavior */}
        <section className="luxury-card p-5">
          <h2 className="text-gold font-semibold flex items-center gap-2 mb-4">
            <Sliders size={18} />
            رفتار برنامه
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">پلتفرم پیش‌فرض</Label>
              <Select
                value={formSettings.defaultPlatform}
                onValueChange={(v) => setFormSettings((p) => ({ ...p, defaultPlatform: v }))}
              >
                <SelectTrigger className="luxury-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy border-gold/30">
                  <SelectItem value="website">سایت (دیجی‌فای)</SelectItem>
                  <SelectItem value="instagram">اینستاگرام</SelectItem>
                  <SelectItem value="ita">ایتا</SelectItem>
                  <SelectItem value="blog">مقاله و بلاگ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-foreground/80">ذخیره خودکار</Label>
              <Switch
                checked={formSettings.autoSave}
                onCheckedChange={(v) => setFormSettings((p) => ({ ...p, autoSave: v }))}
                className="data-[state=checked]:bg-gold"
              />
            </div>
          </div>
        </section>

        {/* Technical */}
        <section className="luxury-card p-5">
          <h2 className="text-gold font-semibold flex items-center gap-2 mb-4">
            <Wrench size={18} />
            تنظیمات فنی
          </h2>
          <div className="space-y-2">
            <Label className="text-foreground/80">تنظیمات پیشرفته</Label>
            <Textarea
              value={formSettings.technical}
              onChange={(e) => setFormSettings((p) => ({ ...p, technical: e.target.value }))}
              placeholder="تنظیمات فنی پیشرفته..."
              className="luxury-input min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </section>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending || saved}
          className="w-full gold-button h-12 text-base font-bold gap-2"
        >
          {updateSettings.isPending ? (
            <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Save size={18} />
          )}
          {saved ? 'ذخیره شد ✓' : 'ذخیره تنظیمات'}
        </Button>
      </div>
    </div>
  );
}
