import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, Heart, ChevronRight, Truck, Shield, RotateCcw, X } from 'lucide-react';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { imageUrl, formatPrice } from '../lib/utils';

export default function ProductDetailPage() {
  const { handle } = useParams<{ handle: string }>();
  const { product, loading, error } = useProduct(handle || null);
  const { addItem, adding } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showZoom, setShowZoom] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Track selection by VALUE ID (unique) not value string (duplicated)
  const [selectedValueIds, setSelectedValueIds] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setSelectedValueIds({});
      setSelectedImage(0);
      setQty(1);
    }
  }, [product]);

  const allOptionsSelected = useMemo(() => {
    if (!product?.options || product.options.length === 0) return true;
    return product.options.every(opt => selectedValueIds[opt.id]);
  }, [product, selectedValueIds]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    const selectedValues = Object.entries(selectedValueIds).map(([optId, valId]) => {
      const opt = product.options?.find(o => o.id === optId);
      const val = opt?.values.find(v => v.id === valId);
      return val?.value;
    }).filter(Boolean);
    if (selectedValues.length === 0) return null;
    return product.variants.find(v => {
      if (!v.options) return false;
      return selectedValues.every(sv => v.options!.some(o => o.value === sv));
    }) || null;
  }, [product, selectedValueIds]);

  // Fetch related products (same category)
  const categoryId = product?.categories?.[0]?.id;
  const { products: relatedProducts } = useProducts(
    categoryId ? { categoryId: [categoryId], limit: 5 } : undefined
  );
  const related = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4);

  // All images: use product images, fallback to thumbnail
  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    if (product.thumbnail) return [{ id: 'thumb', url: product.thumbnail }];
    return [];
  }, [product]);

  const price = selectedVariant?.prices?.[0]?.amount ?? 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem(selectedVariant.id, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const toggleWishlist = () => {
    if (!product) return;
    setWishlist(prev =>
      prev.includes(product.id) ? prev.filter(x => x !== product.id) : [...prev, product.id]
    );
  };

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#c91c1c] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/" className="bg-[#c91c1c] text-white px-6 py-3 rounded text-sm font-bold uppercase tracking-wider">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header spacer (account for sticky header on main page) ── */}
      <div className="h-0"></div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <nav className="flex items-center text-xs text-gray-500 space-x-1">
          <Link to="/" className="hover:text-[#c91c1c] transition-colors">HOME</Link>
          <ChevronRight size={12} />
          {product.categories?.[0] && (
            <>
              <Link to="/" className="hover:text-[#c91c1c] transition-colors uppercase">
                {product.categories[0].name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      {/* ── Main Product Section ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">

          {/* ── Left: Image Gallery ── */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square cursor-zoom-in"
              onClick={() => images.length > 0 && setShowZoom(true)}
            >
              {images.length > 0 ? (
                <img
                  src={imageUrl(images[selectedImage]?.url || images[0]?.url)}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-[#c91c1c]' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={imageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info ── */}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>

            {/* Price */}
            <div className="mt-4">
              {selectedVariant ? (
                <span className="text-3xl font-extrabold text-[#c91c1c]">
                  {price > 0 ? formatPrice(price) : 'Contact for Price'}
                </span>
              ) : (
                <span className="text-lg text-gray-400 font-medium">Select all options to see price</span>
              )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200 my-6"></div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Variant Options */}
            {product.options?.map(opt => (
              <div key={opt.id} className="mb-5">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                  {opt.title}
                </label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map(val => {
                    const label = val.value || val.id;
                    const isSelected = selectedValueIds[opt.id] === val.id;
                    return (
                      <button
                        key={val.id}
                        onClick={() => setSelectedValueIds(prev => ({ ...prev, [opt.id]: val.id }))}
                        className={`px-5 py-2.5 rounded-md border text-sm font-semibold uppercase transition-all ${
                          isSelected
                            ? 'border-[#c91c1c] bg-[#c91c1c] text-white'
                            : 'border-gray-300 hover:border-gray-500 text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">Quantity</label>
              <div className="flex items-center border border-gray-300 rounded-md w-fit">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="p-3 text-gray-500 hover:text-black transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="p-3 text-gray-500 hover:text-black transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart + Wishlist */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={adding || !allOptionsSelected || !selectedVariant}
                className="flex-grow bg-black hover:bg-[#c91c1c] text-white py-4 rounded-md text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {addedFeedback ? '✓ ADDED TO CART' : adding ? 'ADDING...' : !allOptionsSelected ? 'SELECT ALL OPTIONS' : 'ADD TO CART'}
              </button>
              <button
                onClick={toggleWishlist}
                className={`p-4 rounded-md border transition-all ${
                  wishlist.includes(product.id)
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-gray-300 hover:border-gray-500 text-gray-600'
                }`}
              >
                <Heart size={20} className={wishlist.includes(product.id) ? 'fill-red-600' : ''} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center">
                <Truck size={20} className="text-[#c91c1c] mb-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Free Shipping</span>
                <span className="text-[10px] text-gray-400">Above ₹5,000</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield size={20} className="text-[#c91c1c] mb-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Genuine</span>
                <span className="text-[10px] text-gray-400">100% Authentic</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw size={20} className="text-[#c91c1c] mb-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Easy Returns</span>
                <span className="text-[10px] text-gray-400">7 Day Policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fullscreen Image Zoom Modal ── */}
        {showZoom && images.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowZoom(false)}>
            <button onClick={() => setShowZoom(false)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
              <X size={32} />
            </button>
            <img
              src={imageUrl(images[selectedImage]?.url || images[0]?.url)}
              alt={product.title}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={e => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={e => { e.stopPropagation(); setSelectedImage(idx); }}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-white' : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img src={imageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">YOU MAY ALSO LIKE</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Related Products</h2>
              <div className="w-16 h-1 bg-[#c91c1c] mx-auto rounded mt-3"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(p => (
                <Link
                  key={p.id}
                  to={`/product/${p.handle}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <div className="relative bg-gray-50 pt-[100%] overflow-hidden">
                    <img
                      src={imageUrl(p.thumbnail)}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#c91c1c] transition-colors">
                      {p.title}
                    </h3>
                    <span className="text-sm font-bold text-[#c91c1c] mt-1 block">
                      {p.variants?.[0]?.prices?.[0]?.amount ? formatPrice(p.variants[0].prices[0].amount) : 'Contact'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
