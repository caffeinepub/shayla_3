import { useState } from 'react';
import { Plus, Package, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGetProducts, useDeleteProduct } from '@/hooks/useQueries';
import ProductForm from '@/components/ProductForm';
import type { Product } from '../backend';

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useGetProducts();
  const deleteProduct = useDeleteProduct();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: bigint) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('محصول حذف شد');
    } catch {
      toast.error('خطا در حذف محصول');
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditProduct(null);
  };

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gold-text-glow flex items-center gap-2">
            <Package size={24} className="text-gold" />
            محصولات
          </h1>
          <p className="text-gold-muted text-sm mt-1">{products.length} محصول ثبت شده</p>
        </div>
        <Button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="gold-button gap-2"
        >
          <Plus size={16} />
          افزودن محصول
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ProductForm
            product={editProduct}
            onClose={handleFormClose}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در محصولات..."
          className="luxury-input pr-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="luxury-card p-12 text-center">
          <Package size={48} className="text-gold/30 mx-auto mb-4" />
          <p className="text-gold-muted">
            {search ? 'محصولی یافت نشد' : 'هنوز محصولی اضافه نشده است'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((product) => (
            <div key={String(product.id)} className="luxury-card p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-navy/60 border border-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0].getDirectURL()}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={24} className="text-gold/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-gold font-semibold truncate">{product.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gold-muted text-xs">
                    خرید: {Number(product.purchasePrice).toLocaleString('fa-IR')} تومان
                  </span>
                  <span className="text-green-400 text-xs font-medium">
                    فروش: {Number(product.salePrice).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                {product.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 rounded-lg border border-gold/20 text-gold-muted hover:text-gold hover:border-gold/50 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
