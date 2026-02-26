import React, { useState } from 'react';
import { ArrowRight, Clock, Trash2, ExternalLink, Search, AlertCircle, BookOpen, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';
import { useGetHistory, useDeleteHistoryEntry, useClearHistory } from '../hooks/useQueries';
import type { ContentHistoryEntry } from '../types/history';

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return String(timestamp);
  }
}

function HistoryCard({
  entry,
  onDelete,
  onLoad,
}: {
  entry: ContentHistoryEntry;
  onDelete: (id: string) => void;
  onLoad: (entry: ContentHistoryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gold/20 bg-card/60 p-4 hover:border-gold/40 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug truncate">
            {entry.content.title || 'بدون عنوان'}
          </p>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-gold truncate flex items-center gap-1 mt-0.5"
            dir="ltr"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{entry.url}</span>
          </a>
          <p className="text-xs text-gold-muted mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(entry.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'بستن جزئیات' : 'نمایش جزئیات'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-gold hover:text-gold-light hover:bg-gold/10"
            onClick={() => onLoad(entry)}
            title="بارگذاری و ویرایش"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(entry.id)}
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gold/10 space-y-2 text-sm text-muted-foreground">
          {entry.content.description && (
            <div>
              <span className="text-xs font-medium text-gold/70 block mb-0.5">توضیحات:</span>
              <p className="text-xs leading-relaxed line-clamp-4">{entry.content.description}</p>
            </div>
          )}
          {entry.content.specs && (
            <div>
              <span className="text-xs font-medium text-gold/70 block mb-0.5">مشخصات:</span>
              <p className="text-xs leading-relaxed line-clamp-3">{entry.content.specs}</p>
            </div>
          )}
          {entry.content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.content.tags.slice(0, 8).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-gold/10 text-gold border border-gold/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {(entry.content.purchasePrice > 0 || entry.content.salePrice > 0) && (
            <div className="flex gap-4 text-xs">
              {entry.content.purchasePrice > 0 && (
                <span>قیمت خرید: <span className="text-foreground font-medium">{entry.content.purchasePrice.toLocaleString('fa-IR')}</span> تومان</span>
              )}
              {entry.content.salePrice > 0 && (
                <span>قیمت فروش: <span className="text-foreground font-medium">{entry.content.salePrice.toLocaleString('fa-IR')}</span> تومان</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContentHistoryPage() {
  const [search, setSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navigate = useNavigate();
  const { data: history = [], isLoading } = useGetHistory();
  const deleteEntry = useDeleteHistoryEntry();
  const clearHistory = useClearHistory();

  const filtered = search.trim()
    ? history.filter(
        e =>
          e.content.title.toLowerCase().includes(search.toLowerCase()) ||
          e.url.toLowerCase().includes(search.toLowerCase()) ||
          e.content.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : history;

  const handleLoad = (entry: ContentHistoryEntry) => {
    // Navigate to content generator with the URL pre-filled via query param
    navigate({ to: '/content', search: { url: entry.url } as any });
  };

  const handleDelete = (id: string) => {
    deleteEntry.mutate(id);
  };

  const handleClearAll = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => setShowClearConfirm(false),
    });
  };

  const handleExportCSV = () => {
    const headers = 'عنوان,لینک,قیمت خرید,قیمت فروش,تاریخ,توضیحات,تگ‌ها';
    const rows = history.map(entry => {
      const title = `"${(entry.content.title || '').replace(/"/g, '""')}"`;
      const url = `"${entry.url.replace(/"/g, '""')}"`;
      const purchasePrice = entry.content.purchasePrice || '';
      const salePrice = entry.content.salePrice || '';
      const date = formatDate(entry.timestamp);
      const description = `"${(entry.content.description || '').slice(0, 100).replace(/"/g, '""')}"`;
      const tags = `"${entry.content.tags.join(' ')}"`;
      return [title, url, purchasePrice, salePrice, date, description, tags].join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `shayla-history-${dateStr}.csv`;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8,' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/content' })}
              className="gap-2 text-sm border-gold/30 text-gold hover:bg-gold/10 hover:text-gold hover:border-gold/60"
            >
              <ArrowRight className="w-4 h-4 text-gold" />
              <span>بازگشت به تولید محتوا</span>
            </Button>

            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-2 text-sm border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>خروجی CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="gap-2 text-sm border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاک کردن همه</span>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-1">تاریخچه محتوا</h1>
            <p className="text-muted-foreground text-sm">
              {history.length > 0
                ? `${history.length} محتوای ذخیره‌شده`
                : 'هنوز محتوایی ذخیره نشده'}
            </p>
          </div>
        </div>

        {/* Clear confirm */}
        {showClearConfirm && (
          <Alert className="mb-4 border-destructive/40 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-sm">آیا مطمئن هستید؟ همه تاریخچه پاک می‌شود.</span>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={clearHistory.isPending}
                >
                  بله، پاک کن
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  انصراف
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        {history.length > 3 && (
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجو در تاریخچه..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9 text-sm"
            />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">
              {search.trim() ? 'موردی با این جستجو پیدا نشد' : 'تاریخچه‌ای برای نمایش وجود ندارد'}
            </p>
            {!search.trim() && (
              <p className="text-xs mt-2 opacity-60">
                پس از تولید محتوا، هر آیتم به‌صورت خودکار ذخیره می‌شود
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(entry => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onLoad={handleLoad}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
