import React, { useState, useRef } from 'react';
import { Link2, Loader2, AlertCircle, CheckCircle2, Info, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';
import { useActor } from '../hooks/useActor';
import { generateContentFromUrl, type GeneratedContent } from '../utils/contentGenerator';
import ContentOutput from '../components/ContentOutput';
import ProductUploadHelper from '../components/ProductUploadHelper';
import { useAddHistoryEntry } from '../hooks/useQueries';

interface ProgressState {
  step: number; // 0=idle, 1=fetch, 2=analyze, 3=generate, 4=done
  message: string;
  detail: string;
}

const INITIAL_PROGRESS: ProgressState = {
  step: 0,
  message: '',
  detail: '',
};

const STEPS = [
  { id: 1, label: 'دریافت اطلاعات' },
  { id: 2, label: 'تحلیل محتوا' },
  { id: 3, label: 'تولید محتوا' },
];

export default function ContentGeneratorPage() {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { actor } = useActor();
  const addHistoryEntry = useAddHistoryEntry();

  const handleGenerate = async () => {
    if (!url.trim()) return;

    setIsGenerating(true);
    setError(null);
    setWarning(null);
    setGeneratedContent(null);
    setProgress({ step: 1, message: 'دریافت اطلاعات', detail: 'در حال اتصال...' });

    try {
      const content = await generateContentFromUrl(
        url.trim(),
        actor,
        (step, message, detail) => {
          setProgress({ step, message, detail: detail || '' });
        }
      );

      setProgress({ step: 4, message: 'تولید محتوا', detail: 'محتوا با موفقیت تولید شد!' });
      setGeneratedContent(content);

      // Check if extraction was partial
      if (!content.productData.title || content.productData.title === 'محصول') {
        setWarning('اطلاعات کامل محصول استخراج نشد. لطفاً محتوا را بررسی و ویرایش کنید.');
      }

      // Save to history — always create a new entry
      try {
        addHistoryEntry.mutate({
          url: url.trim(),
          content: {
            title: content.title,
            purchasePrice: content.purchasePrice,
            salePrice: content.salePrice,
            description: content.description,
            specs: content.specs,
            tags: content.tags,
          },
          notes: '',
        });
      } catch (_) {
        // History save failure is non-critical
      }
    } catch (e: any) {
      setError(e?.message || 'خطایی در تولید محتوا رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      // Always reset progress after completion or failure
      setTimeout(() => {
        setProgress(INITIAL_PROGRESS);
        setIsGenerating(false);
      }, 1500);
    }
  };

  const handleClear = () => {
    setUrl('');
    setGeneratedContent(null);
    setError(null);
    setWarning(null);
    setProgress(INITIAL_PROGRESS);
    // Focus the URL input so user can immediately type the next link
    setTimeout(() => {
      urlInputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const showClearButton = !isGenerating && (url.trim() !== '' || generatedContent !== null || error !== null || warning !== null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/' })}
              className="gap-2 text-sm border-gold/30 text-gold hover:bg-gold/10 hover:text-gold hover:border-gold/60"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به صفحه اصلی</span>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تولید محتوای هوشمند
            </h1>
            <p className="text-muted-foreground text-sm">
              لینک محصول را وارد کنید تا محتوای بهینه برای شیلا تولید شود
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={urlInputRef}
              type="url"
              placeholder="https://www.digikala.com/product/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              className="pr-9 text-sm"
              dir="ltr"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !url.trim()}
            className="gap-2 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال پردازش...</span>
              </>
            ) : (
              <span>تولید محتوا</span>
            )}
          </Button>
          {showClearButton && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="gap-2 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/70"
              title="پاک کردن همه چیز"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">پاک کردن</span>
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        {isGenerating && progress.step > 0 && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-card/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{progress.message}</p>
                {progress.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{progress.detail}</p>
                )}
              </div>
            </div>
            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, idx) => {
                const isActive = progress.step === step.id;
                const isDone = progress.step > step.id;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isDone ? '✓' : step.id}
                      </div>
                      <span
                        className={`text-xs ${
                          isActive ? 'text-primary font-medium' : isDone ? 'text-green-500' : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-px ${isDone ? 'bg-green-500' : 'bg-border'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        {warning && (
          <Alert className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <Info className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-600">توجه</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">{warning}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {generatedContent && !error && (
          <Alert className="mb-6 border-green-500/30 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">موفق</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              محتوا با موفقیت تولید شد.
              {generatedContent.images.length > 0 && ` ${generatedContent.images.length} تصویر استخراج شد.`}
              {generatedContent.purchasePrice > 0 && ` قیمت خرید: ${generatedContent.purchasePrice.toLocaleString('fa-IR')} تومان.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Output */}
        {generatedContent && (
          <>
            <ContentOutput content={generatedContent} />
            <ProductUploadHelper content={generatedContent} />
          </>
        )}

        {/* Empty state */}
        {!generatedContent && !isGenerating && !error && (
          <div className="text-center py-16 text-muted-foreground">
            <Link2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">لینک محصول را وارد کنید و دکمه «تولید محتوا» را بزنید</p>
            <p className="text-xs mt-2 opacity-70">
              پشتیبانی از: دیجی‌کالا، باسلام، ترب، شیلا، شیپور، اسنپ‌شاپ، آمازون، eBay، AliExpress
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
