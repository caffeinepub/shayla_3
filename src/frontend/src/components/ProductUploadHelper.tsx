import React, { useState } from 'react';
import { Copy, Check, Package, Tag, Image, FileText, DollarSign, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GeneratedContent } from '../utils/contentGenerator';

interface ProductUploadHelperProps {
  content: GeneratedContent;
}

function formatPrice(price: number): string {
  if (price <= 0) return '—';
  return price.toLocaleString('fa-IR') + ' تومان';
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback
  }
  // Fallback: textarea approach
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.top = '0';
    textarea.style.left = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (_) {
    return false;
  }
}

interface CopyButtonProps {
  text: string;
  label?: string;
}

function CopyButton({ text, label = 'کپی' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-500">کپی شد!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}

interface FieldRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  multiline?: boolean;
}

function FieldRow({ label, value, icon, multiline = false }: FieldRowProps) {
  if (!value || value === '—') return null;

  return (
    <div className="border border-border/40 rounded-lg p-3 bg-card/30">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <CopyButton text={value} />
      </div>
      {multiline ? (
        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto">
          {value}
        </pre>
      ) : (
        <p className="text-sm text-foreground font-medium">{value}</p>
      )}
    </div>
  );
}

export default function ProductUploadHelper({ content }: ProductUploadHelperProps) {
  const [allCopied, setAllCopied] = useState(false);

  const { productData, purchasePrice, salePrice, description, specs, tags, images, shortDescription } = content;
  const productName = productData.title || 'محصول';
  const salePriceCalc = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : salePrice;

  const allFieldsText = `=== اطلاعات محصول برای بارگذاری در شیلا ===

نام محصول: ${productName}
قیمت خرید: ${formatPrice(purchasePrice)}
قیمت فروش (۴۰٪ سود): ${formatPrice(salePriceCalc)}

توضیح کوتاه:
${shortDescription || description.substring(0, 200)}

توضیح کامل:
${description}

مشخصات فنی:
${specs || '—'}

تگ‌ها:
${tags.join(', ')}

لینک تصاویر (${images.length} تصویر):
${images.join('\n') || '—'}

===================================`;

  const handleCopyAll = async () => {
    const success = await copyToClipboard(allFieldsText);
    if (success) {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-primary/5">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            راهنمای بارگذاری محصول در شیلا
          </h3>
          <Badge variant="secondary" className="text-xs">
            {images.length} تصویر
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="h-8 text-xs gap-1.5 border-primary/30 hover:border-primary/60"
        >
          {allCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">همه کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>کپی همه فیلدها</span>
            </>
          )}
        </Button>
      </div>

      {/* Fields */}
      <div className="p-4 grid gap-3">
        <FieldRow
          label="نام محصول"
          value={productName}
          icon={<Package className="w-3 h-3" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <FieldRow
            label="قیمت خرید"
            value={formatPrice(purchasePrice)}
            icon={<DollarSign className="w-3 h-3" />}
          />
          <FieldRow
            label="قیمت فروش (۴۰٪ سود)"
            value={formatPrice(salePriceCalc)}
            icon={<DollarSign className="w-3 h-3" />}
          />
        </div>

        <FieldRow
          label="توضیح کوتاه (حداکثر ۲۰۰ کاراکتر)"
          value={shortDescription || description.substring(0, 200)}
          icon={<FileText className="w-3 h-3" />}
          multiline
        />

        <FieldRow
          label="توضیح کامل محصول"
          value={description}
          icon={<FileText className="w-3 h-3" />}
          multiline
        />

        {specs && (
          <FieldRow
            label="مشخصات فنی"
            value={specs}
            icon={<List className="w-3 h-3" />}
            multiline
          />
        )}

        <FieldRow
          label="تگ‌های محصول"
          value={tags.join(', ')}
          icon={<Tag className="w-3 h-3" />}
        />

        {images.length > 0 && (
          <div className="border border-border/40 rounded-lg p-3 bg-card/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Image className="w-3 h-3" />
                <span>لینک تصاویر ({images.length} تصویر)</span>
              </div>
              <CopyButton text={images.join('\n')} label="کپی همه لینک‌ها" />
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {images.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <a
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate flex-1"
                  >
                    {img}
                  </a>
                  <CopyButton text={img} label="" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          این اطلاعات برای بارگذاری محصول در{' '}
          <a href="https://shylaa.ir" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            shylaa.ir
          </a>{' '}
          آماده شده است
        </p>
      </div>
    </div>
  );
}
