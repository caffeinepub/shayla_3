import { X, Clock, Trash2, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteHistoryEntry } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { ContentHistoryEntry } from '../types/history';

interface ContentHistoryProps {
  entries: ContentHistoryEntry[];
  onSelect: (entry: ContentHistoryEntry) => void;
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'تاریخ نامشخص';
  }
}

export default function ContentHistory({ entries, onSelect, onClose }: ContentHistoryProps) {
  const deleteEntry = useDeleteHistoryEntry();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('از تاریخچه حذف شد');
    } catch {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="luxury-card p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gold font-semibold flex items-center gap-2">
          <Clock size={16} />
          تاریخچه تولید محتوا
        </h3>
        <button onClick={onClose} className="text-gold-muted hover:text-gold transition-colors">
          <X size={18} />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-gold-muted text-sm text-center py-6">هنوز محتوایی تولید نشده است</p>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="flex items-start justify-between p-3 rounded-xl border border-gold/15 hover:border-gold/40 bg-navy/40 hover:bg-navy/60 cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gold text-sm font-medium truncate">
                    {entry.content.title.split('|')[0].trim() || 'محتوای بدون عنوان'}
                  </p>
                  {entry.url && (
                    <p className="text-gold-muted text-xs truncate mt-0.5 flex items-center gap-1">
                      <ExternalLink size={10} />
                      {entry.url}
                    </p>
                  )}
                  <p className="text-gold-muted/60 text-xs mt-1">{formatTimestamp(entry.timestamp)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1 mr-2 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
