import { useState } from 'react';
import { Plus, Handshake, Pencil, Trash2, Link2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useGetAffiliates, useAddOrUpdateAffiliate, useDeleteAffiliate } from '@/hooks/useQueries';
import type { Affiliate } from '../backend';

function AffiliateForm({
  affiliate,
  onClose,
}: {
  affiliate: Affiliate | null;
  onClose: () => void;
}) {
  const [link, setLink] = useState(affiliate?.link || '');
  const [commission, setCommission] = useState(affiliate ? String(Number(affiliate.commission)) : '');
  const [notes, setNotes] = useState(affiliate?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOrUpdate = useAddOrUpdateAffiliate();

  const handleSubmit = async () => {
    if (!link.trim()) { toast.error('لینک همکاری الزامی است'); return; }

    setIsSubmitting(true);
    try {
      const data: Affiliate = {
        id: affiliate?.id ?? BigInt(0),
        link: link.trim(),
        commission: BigInt(Math.round(parseFloat(commission) || 0)),
        notes: notes.trim(),
      };
      await addOrUpdate.mutateAsync(data);
      toast.success(affiliate ? 'همکاری ویرایش شد' : 'همکاری اضافه شد');
      onClose();
    } catch {
      toast.error('خطا در ذخیره');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="luxury-card p-6 mb-6" dir="rtl">
      <h3 className="text-gold font-bold text-lg mb-4">{affiliate ? 'ویرایش همکاری' : 'افزودن همکاری جدید'}</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gold text-sm flex items-center gap-2"><Link2 size={14} />لینک همکاری *</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="luxury-input" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-gold text-sm flex items-center gap-2"><Percent size={14} />درصد کمیسیون</Label>
          <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="مثال: 10" className="luxury-input" />
        </div>
        <div className="space-y-2">
          <Label className="text-gold text-sm">یادداشت‌ها</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات درباره این همکاری..." className="luxury-input min-h-[80px] resize-none" rows={3} />
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gold-button flex-1 gap-2">
            {isSubmitting && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />}
            ذخیره
          </Button>
          <Button onClick={onClose} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">انصراف</Button>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateMarketingPage() {
  const [showForm, setShowForm] = useState(false);
  const [editAffiliate, setEditAffiliate] = useState<Affiliate | null>(null);

  const { data: affiliates = [], isLoading } = useGetAffiliates();
  const deleteAffiliate = useDeleteAffiliate();

  const handleDelete = async (id: bigint) => {
    if (!confirm('آیا از حذف این همکاری مطمئن هستید؟')) return;
    try {
      await deleteAffiliate.mutateAsync(id);
      toast.success('همکاری حذف شد');
    } catch {
      toast.error('خطا در حذف');
    }
  };

  const handleEdit = (a: Affiliate) => {
    setEditAffiliate(a);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditAffiliate(null);
  };

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gold-text-glow flex items-center gap-2">
            <Handshake size={24} className="text-gold" />
            همکاری در فروش
          </h1>
          <p className="text-gold-muted text-sm mt-1">{affiliates.length} همکاری ثبت شده</p>
        </div>
        <Button onClick={() => { setEditAffiliate(null); setShowForm(true); }} className="gold-button gap-2">
          <Plus size={16} />
          افزودن همکاری
        </Button>
      </div>

      {showForm && <AffiliateForm affiliate={editAffiliate} onClose={handleFormClose} />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : affiliates.length === 0 ? (
        <div className="luxury-card p-12 text-center">
          <Handshake size={48} className="text-gold/30 mx-auto mb-4" />
          <p className="text-gold-muted">هنوز همکاری‌ای ثبت نشده است</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {affiliates.map((a) => (
            <div key={String(a.id)} className="luxury-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 size={14} className="text-gold flex-shrink-0" />
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold text-sm font-medium truncate hover:underline"
                      dir="ltr"
                    >
                      {a.link}
                    </a>
                  </div>
                  {Number(a.commission) > 0 && (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <Percent size={12} />
                      <span>کمیسیون: {Number(a.commission)}٪</span>
                    </div>
                  )}
                  {a.notes && (
                    <p className="text-gold-muted text-xs mt-2 leading-relaxed">{a.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(a)} className="p-2 rounded-lg border border-gold/20 text-gold-muted hover:text-gold hover:border-gold/50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
