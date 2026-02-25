import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAddOrUpdateProduct } from '@/hooks/useQueries';
import type { Product, ProductInput } from '../backend';
import { ExternalBlob } from '../backend';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [purchasePrice, setPurchasePrice] = useState(product ? String(Number(product.purchasePrice)) : '');
  const [salePrice, setSalePrice] = useState(product ? String(Number(product.salePrice)) : '');
  const [description, setDescription] = useState(product?.description || '');
  const [specs, setSpecs] = useState(product?.specs || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOrUpdate = useAddOrUpdateProduct();

  const handlePurchasePriceChange = (val: string) => {
    setPurchasePrice(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSalePrice(String(Math.round(num * 1.4)));
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('نام محصول الزامی است'); return; }
    if (!purchasePrice) { toast.error('قیمت خرید الزامی است'); return; }

    setIsSubmitting(true);
    try {
      // Convert image files to ExternalBlob
      const imageBlobs: ExternalBlob[] = await Promise.all(
        imageFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return ExternalBlob.fromBytes(new Uint8Array(buffer));
        })
      );

      const existingImages = product?.images || [];

      const input: ProductInput = {
        id: product ? product.id : undefined,
        name: name.trim(),
        purchasePrice: BigInt(Math.round(parseFloat(purchasePrice) || 0)),
        salePrice: BigInt(Math.round(parseFloat(salePrice) || 0)),
        description: description.trim(),
        specs: specs.trim(),
        tags,
        images: [...existingImages, ...imageBlobs],
      };

      await addOrUpdate.mutateAsync(input);
      toast.success(product ? 'محصول ویرایش شد' : 'محصول اضافه شد');
      onClose();
    } catch (err) {
      toast.error('خطا در ذخیره محصول');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="luxury-card p-6" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-gold font-bold text-lg">{product ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
        <button onClick={onClose} className="text-gold-muted hover:text-gold transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label className="text-gold text-sm">نام محصول *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام محصول را وارد کنید" className="luxury-input" />
        </div>

        <div className="space-y-2">
          <Label className="text-gold text-sm">قیمت خرید (تومان) *</Label>
          <Input
            type="number"
            value={purchasePrice}
            onChange={(e) => handlePurchasePriceChange(e.target.value)}
            placeholder="0"
            className="luxury-input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gold text-sm">قیمت فروش (تومان)</Label>
          <Input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="خودکار (+۴۰٪)"
            className="luxury-input"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-gold text-sm">توضیحات</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات محصول..." className="luxury-input min-h-[80px] resize-none" rows={3} />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-gold text-sm">مشخصات فنی</Label>
          <Textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="مشخصات فنی محصول..." className="luxury-input min-h-[80px] resize-none" rows={3} />
        </div>

        {/* Tags */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-gold text-sm">تگ‌ها</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="تگ جدید..."
              className="luxury-input flex-1"
            />
            <Button onClick={addTag} variant="outline" size="icon" className="border-gold/30 text-gold hover:bg-gold/10">
              <Plus size={16} />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gold-muted hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-gold text-sm">تصاویر</Label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-gold-muted file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border file:border-gold/30 file:text-gold file:bg-transparent file:cursor-pointer hover:file:bg-gold/10"
          />
          {imageFiles.length > 0 && (
            <p className="text-gold-muted text-xs">{imageFiles.length} تصویر انتخاب شده</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="gold-button flex-1 gap-2">
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {product ? 'ذخیره تغییرات' : 'افزودن محصول'}
        </Button>
        <Button onClick={onClose} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
          انصراف
        </Button>
      </div>
    </div>
  );
}
