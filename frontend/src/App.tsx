import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, User, Menu, X, Plus, Minus, Check,
  Phone, Mail, MapPin, Trash2, AlertCircle, LogOut,
} from 'lucide-react';
import { useProducts, useCategories, type Product } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useSearch } from './hooks/useSearch';
import { useVehicles } from './hooks/useVehicles';
import { useVehicleProducts } from './hooks/useVehicleProducts';
import { useBlogPosts } from './hooks/useBlogs';
import { useInstagramReels } from './hooks/useInstagram';
import { formatPrice, imageUrl } from './lib/utils';
import ChatBot from './components/ChatBot';

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, register, customer, logout, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  if (customer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70" onClick={onClose}></div>
        <div className="relative bg-white text-black w-full max-w-sm rounded-lg p-8 shadow-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20} /></button>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"><User size={32} className="text-[#c91c1c]" /></div>
            <h3 className="text-xl font-bold">Welcome, {customer.first_name || customer.email}</h3>
            <p className="text-gray-500 text-sm">{customer.email}</p>
            <button onClick={() => { logout(); onClose(); }} className="w-full bg-black hover:bg-[#c91c1c] text-white py-3 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"><LogOut size={14} /><span>Logout</span></button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ first_name: firstName, last_name: lastName, email, password });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative bg-white text-black w-full max-w-md rounded-lg p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20} /></button>
        <h3 className="text-2xl font-bold border-b border-gray-100 pb-4 mb-6">{mode === 'login' ? 'Login' : 'Create Account'}</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
          </div>
          <button type="submit" disabled={submitting || authLoading} className="w-full bg-[#c91c1c] hover:bg-red-700 text-white font-bold py-3 rounded text-xs uppercase tracking-widest shadow-lg disabled:opacity-50">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm text-gray-500">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => { setMode('register'); setError(''); }} className="text-[#c91c1c] font-semibold hover:underline">Register</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="text-[#c91c1c] font-semibold hover:underline">Login</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, inWishlist, onToggleWishlist }: {
  product: Product;
  onAddToCart: () => void;
  inWishlist: boolean;
  onToggleWishlist: () => void;
}) {
  const price = product.variants?.[0]?.prices?.[0]?.amount ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col">
      <button
        onClick={onToggleWishlist}
        className="absolute top-3 right-3 z-10 bg-white/80 hover:bg-white text-gray-600 hover:text-[#c91c1c] p-2 rounded-full shadow transition-all duration-300 focus:outline-none"
      >
        <Heart size={18} className={inWishlist ? 'fill-red-600 text-red-600' : ''} />
      </button>
      <Link to={`/product/${product.handle}`} onClick={() => window.scrollTo(0, 0)} className="relative bg-gray-50 pt-[100%] overflow-hidden block">
        <img
          src={imageUrl(product.thumbnail)}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>
      <div className="p-6 flex-grow flex flex-col justify-between">
        <Link to={`/product/${product.handle}`} onClick={() => window.scrollTo(0, 0)}>
          <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-1 group-hover:text-[#c91c1c] transition-colors">
            {product.title}
          </h3>
          <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </Link>
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-base font-bold text-[#c91c1c]">
            {price > 0 ? formatPrice(price) : 'Contact'}
          </span>
          <button
            onClick={onAddToCart}
            className="bg-black hover:bg-[#c91c1c] text-white text-[10px] font-bold py-2.5 px-4 rounded uppercase tracking-wider transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reel Player Modal ───────────────────────────────────────────────────────
function ReelPlayerModal({ shortcode, onClose }: { shortcode: string; onClose: () => void }) {
  // Escape key + body scroll lock
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[420px] mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white text-3xl font-bold z-10"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="rounded-xl overflow-hidden shadow-2xl bg-black aspect-[9/16]">
          <iframe
            src={`https://www.instagram.com/reel/${shortcode}/embed/?autoplay=1`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title="Instagram Reel"
          />
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeQuickView, setActiveQuickView] = useState<unknown>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [quickViewOptions, setQuickViewOptions] = useState<Record<string, string>>({});
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutState, setCheckoutState] = useState('');
  const [playingReel, setPlayingReel] = useState<string | null>(null);

  // ─── Dynamic title ─────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'CarTunez - Premium Car Accessories Online India | Floor Mats, LED Lights, Seat Covers';
  }, []);
  // ─── API hooks ───────────────────────────────────────────────────────────
  const { categories } = useCategories();
  const categoryIds = useMemo(() => {
    if (selectedCategory === 'all') return undefined;
    const cat = categories.find(c => c.name.toLowerCase() === selectedCategory || c.handle === selectedCategory);
    return cat ? [cat.id] : undefined;
  }, [selectedCategory, categories]);
  const { products, count, loading: productsLoading } = useProducts({ categoryId: categoryIds, limit: 20 });
  const { cart, itemCount, total, addItem, updateItem, removeItem, adding, setEmail: setCartEmail, checkout } = useCart();
  const { customer } = useAuth();
  const { results: searchResults, search: doSearch, clear: clearSearch } = useSearch();
  const { makes, models, years, variants, selectedMake, setSelectedMake, selectedModel, setSelectedModel, selectedYear, setSelectedYear, selectedVariant, setSelectedVariant, loading: vehicleLoading, reset } = useVehicles();
  const { posts: blogPosts } = useBlogPosts(4);
  const { reels: instagramReels } = useInstagramReels(8);

  // ─── Search input handler ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    doSearch(val);
  }, [doSearch]);

  // ─── Quick view setup ────────────────────────────────────────────────────
  const qv = activeQuickView as Product | null;

  useEffect(() => {
    if (qv) {
      setQuickViewQty(1);
      const initial: Record<string, string> = {};
      for (const opt of qv.options || []) {
        initial[opt.id] = opt.values?.[0]?.title || opt.values?.[0]?.id || '';
      }
      setQuickViewOptions(initial);
    }
  }, [qv]);

  const qvSelectedVariant = useMemo(() => {
    if (!qv?.variants) return null;
    const selectedValues = Object.values(quickViewOptions).filter(Boolean);
    if (selectedValues.length === 0) return qv.variants[0] || null;
    return qv.variants.find(v => {
      if (selectedValues.includes(v.title)) return true;
      if (!v.options) return false;
      return selectedValues.every(sv => v.options!.some(o => o.value === sv));
    }) || qv.variants[0] || null;
  }, [qv, quickViewOptions]);

  // ─── Cart checkout ───────────────────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (!checkoutEmail) {
      alert('Please enter your email');
      return;
    }
    setOrderPlaced(true);
    try {
      await setCartEmail(checkoutEmail);
      await checkout();
      setTimeout(() => {
        setOrderPlaced(false);
        setIsCheckoutOpen(false);
        setCheckoutEmail('');
        setCheckoutName('');
        setCheckoutPhone('');
        setCheckoutAddress('');
        setCheckoutCity('');
        setCheckoutState('');
      }, 2000);
    } catch (err: unknown) {
      setOrderPlaced(false);
      alert(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    }
  }, [checkoutEmail, checkout, setCartEmail]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const addToCartFromProduct = useCallback(async (product: { variants?: { id: string }[] }) => {
    const variantId = product.variants?.[0]?.id;
    if (variantId) await addItem(variantId);
  }, [addItem]);

  const handleQuickViewAdd = useCallback(async () => {
    if (qvSelectedVariant) {
      await addItem(qvSelectedVariant.id, quickViewQty);
      setActiveQuickView(null);
    }
  }, [qvSelectedVariant, quickViewQty, addItem]);

  // ─── Dynamic nav from Medusa categories ──────────────────────────────────
  const navItems = useMemo(() => {
    const items = [{ label: 'HOME', cat: 'all' }];
    for (const c of categories) {
      items.push({ label: c.name.toUpperCase(), cat: c.handle });
    }
    return items;
  }, [categories]);

  // ─── Vehicle filter (Show Products button) ───────────────────────────────
  const [vehicleFiltered, setVehicleFiltered] = useState(false);
  const [vehicleLabel, setVehicleLabel] = useState('');
  const {
    compatible: vCompatibleProducts,
    other: vOtherProducts,
    totalCount: vTotalCount,
    loading: vProductsLoading,
  } = useVehicleProducts(
    vehicleFiltered
      ? selectedVariant
        ? { variantId: selectedVariant }
        : selectedYear
          ? { yearId: selectedYear }
          : undefined
      : undefined
  );

  const handleShowVehicleProducts = useCallback(() => {
    if (selectedYear) {
      const make = makes.find(m => m.id === selectedMake);
      const model = models.find(m => m.id === selectedModel);
      const year = years.find(y => y.id === selectedYear);
      const variant = variants.find(v => v.id === selectedVariant);
      const label = `${make?.name || ''} ${model?.name || ''} ${year?.year || ''}${variant ? ' - ' + variant.name : ''}`.trim();
      setVehicleLabel(label);
      setVehicleFiltered(true);
      setSelectedCategory('all');
    }
  }, [selectedMake, selectedModel, selectedYear, selectedVariant, makes, models, years, variants]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-red-600 selection:text-white antialiased">

      {/* 1. TOP BAR */}
      <div className="bg-[#c91c1c] text-white text-xs py-2 px-4 flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0 tracking-wider">
        <div className="font-semibold text-center md:text-left">FREE SHIPPING FOR ALL ORDERS ABOVE ₹5,000</div>
        <div className="flex items-center space-x-6">
          <div className="h-3 w-px bg-white/30 hidden md:block"></div>
          <div className="flex space-x-4">
            <a href="#footer" className="hover:text-gray-200 transition-colors font-medium">CONTACT US</a>
            <a href="#footer" className="hover:text-gray-200 transition-colors font-medium">FAQS</a>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="bg-black text-white py-4 px-4 md:px-8 border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white hover:text-[#c91c1c]">
              <Menu size={26} />
            </button>
            <a href="/" className="flex items-center space-x-3 select-none group">
              <img src="/logo.png" alt="Car Tunez" className="h-10 w-10 object-contain rounded" />
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wider text-white group-hover:text-[#c91c1c] transition-colors leading-none">CAR TUNEZ</span>
                <span className="text-[8px] text-gray-400 tracking-wider font-semibold mt-1">GET YOUR CAR ROLLING IN STYLE.</span>
              </div>
            </a>
            <div className="md:hidden flex items-center space-x-4">
              <button onClick={() => setIsCartOpen(true)} className="relative text-white">
                <ShoppingCart size={22} />
                {itemCount > 0 && <span className="absolute -top-2 -right-2 bg-[#c91c1c] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:max-w-2xl flex items-stretch">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search for products, brands..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-white text-black pl-4 pr-10 py-3 rounded-l border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c91c1c] text-sm"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); clearSearch(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setVehicleFiltered(false); }}
              className="bg-gray-100 text-gray-700 px-3 border-y border-r border-gray-300 text-xs font-semibold focus:outline-none hidden sm:block"
            >
              <option value="all">ALL CATEGORIES</option>
              {categories.map(c => <option key={c.id} value={c.handle}>{c.name.toUpperCase()}</option>)}
            </select>
            <button className="bg-[#c91c1c] hover:bg-red-700 text-white px-5 rounded-r flex items-center justify-center transition-colors">
              <Search size={18} />
            </button>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-2xl z-50 text-black text-sm divide-y divide-gray-100">
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => { setIsSearchFocused(false); setSearchQuery(''); clearSearch(); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center space-x-3">
                      {p.thumbnail && <img src={imageUrl(p.thumbnail)} alt={p.title} className="w-8 h-8 object-cover rounded" />}
                      <div>
                        <div className="font-semibold text-gray-900">{p.title}</div>
                      </div>
                    </div>
                    {p.price && <div className="font-semibold text-[#c91c1c]">{p.price}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-xs">
              <User size={20} className="text-gray-300" />
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px]">Welcome</span>
                {customer ? (
                  <button onClick={() => setIsAuthOpen(true)} className="font-bold hover:text-[#c91c1c]">{customer.first_name || customer.email}</button>
                ) : (
                  <button onClick={() => setIsAuthOpen(true)} className="font-bold hover:text-[#c91c1c]">LOGIN / REGISTER</button>
                )}
              </div>
            </div>
            <button onClick={() => setIsWishlistOpen(true)} className="relative text-gray-300 hover:text-white">
              <Heart size={22} className={wishlist.length > 0 ? 'fill-red-600 text-red-600' : ''} />
              {wishlist.length > 0 && <span className="absolute -top-2 -right-2 bg-[#c91c1c] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{wishlist.length}</span>}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="flex items-center space-x-3 text-white border-l border-white/20 pl-6 group">
              <div className="relative">
                <ShoppingCart size={24} className="text-gray-300 group-hover:text-white" />
                {itemCount > 0 && <span className="absolute -top-2 -right-2 bg-[#c91c1c] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">{itemCount}</span>}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400">Shopping Cart</span>
                <span className="text-xs font-bold text-red-500">{formatPrice(total)}</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* 3. NAV BAR */}
      <nav className="bg-black/95 text-white text-sm font-semibold border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8">
          <div className="flex items-center space-x-8">
            <button onClick={() => setIsSidebarOpen(true)} className="bg-[#c91c1c] hover:bg-red-700 text-white px-6 py-4 flex items-center space-x-2 transition-all">
              <Menu size={16} />
              <span>BROWSE CATEGORIES</span>
            </button>
            {navItems.map(item => (
              <button
                key={item.cat}
                onClick={() => { setSelectedCategory(item.cat); setVehicleFiltered(false); }}
                className={`py-4 transition-colors ${selectedCategory === item.cat && !vehicleFiltered ? 'text-[#c91c1c]' : 'hover:text-[#c91c1c]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 4. HERO */}
      <section className="relative bg-black overflow-hidden">
        <img src="/hero-bg.png" alt="Car Tunez - Performance Meets Style" className="w-full h-auto object-cover" loading="eager" />
      </section>

      {/* 5. VEHICLE COMPATIBILITY FINDER */}
      <section className="bg-[#111] py-12 px-4 md:px-8 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">FIND ACCESSORIES FOR MY CAR</span>
            <h2 className="text-2xl font-bold text-white mt-1">Select Your Vehicle</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select value={selectedMake} onChange={e => setSelectedMake(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c91c1c]">
              <option value="" className="text-black">Select Brand</option>
              {makes.map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
            </select>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} disabled={!selectedMake || vehicleLoading.models} className="bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c91c1c] disabled:opacity-40">
              <option value="" className="text-black">Select Model</option>
              {models.map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} disabled={!selectedModel || vehicleLoading.years} className="bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c91c1c] disabled:opacity-40">
              <option value="" className="text-black">Select Year</option>
              {years.map(y => <option key={y.id} value={y.id} className="text-black">{y.year}</option>)}
            </select>
            <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)} disabled={!selectedYear || vehicleLoading.variants} className="bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c91c1c] disabled:opacity-40">
              <option value="" className="text-black">Select Variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id} className="text-black">
                  {v.name}{v.fuel_type ? ` (${v.fuel_type}` : ''}{v.transmission ? `, ${v.transmission})` : v.fuel_type ? ')' : ''}
                </option>
              ))}
            </select>
            <button onClick={handleShowVehicleProducts} disabled={!selectedYear} className="bg-[#c91c1c] hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded uppercase tracking-wider text-xs transition-colors">
              Show Products
            </button>
          </div>
        </div>
      </section>

      {/* 6. CATEGORIES CARDS - from Medusa */}
      {categories.length > 0 && (
        <section className="bg-[#0a0a0a] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Shop Our Exclusive Range</h2>
              <div className="w-16 h-1 bg-[#c91c1c] mx-auto rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.slice(0, 3).map(cat => (
                <div key={cat.id} onClick={() => { setSelectedCategory(cat.handle); setVehicleFiltered(false); }} className="group relative h-64 rounded-lg overflow-hidden cursor-pointer shadow-2xl transition-transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-gray-800 to-gray-900 flex items-end">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                    <h3 className="text-2xl font-bold tracking-widest mb-2 uppercase">{cat.name}</h3>
                    <span className="inline-block bg-[#c91c1c] group-hover:bg-red-700 text-white text-xs font-bold py-3 px-6 rounded uppercase tracking-wider transition-colors">Shop Now</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto py-16 px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 pb-4 mb-8">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">FROM OUR CATALOGUE</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {vehicleFiltered ? `PRODUCTS FOR ${vehicleLabel}` : categories.find(c => c.handle === selectedCategory)?.name?.toUpperCase() || 'ALL PRODUCTS'}
              </h2>
            </div>
            {vehicleFiltered && (
              <button onClick={() => { setVehicleFiltered(false); reset(); }} className="text-xs text-red-600 underline whitespace-nowrap">
                Clear filter
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0 text-xs text-gray-500">
            <span>{vehicleFiltered ? `${vCompatibleProducts.length + vOtherProducts.length} products found` : `${count} products found`}</span>
          </div>
        </div>

        {vehicleFiltered ? (
          /* ── Vehicle-filtered mode ── */
          vProductsLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#c91c1c] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm">Finding compatible products...</p>
            </div>
          ) : vCompatibleProducts.length === 0 && vOtherProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No Products Found</h3>
              <p className="text-gray-500 text-sm mt-1">No products found for this vehicle. Try a different selection or browse all products.</p>
              <button onClick={() => { setSelectedCategory('all'); setVehicleFiltered(false); reset(); }} className="mt-4 bg-[#c91c1c] text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider">View All</button>
            </div>
          ) : (
            <>
              {/* Compatible products */}
              {vCompatibleProducts.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center space-x-3 mb-5">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      FITS YOUR {vehicleLabel}
                    </span>
                    <span className="text-xs text-gray-400">{vCompatibleProducts.length} compatible</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vCompatibleProducts.map(product => (
                       <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={() => addToCartFromProduct(product)}
                        inWishlist={wishlist.includes(product.id)}
                        onToggleWishlist={() => toggleWishlist(product.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {vCompatibleProducts.length > 0 && vOtherProducts.length > 0 && (
                <div className="border-t border-gray-200 my-8 pt-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OTHER PRODUCTS</span>
                </div>
              )}

              {/* Other products */}
              {vOtherProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {vOtherProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={() => addToCartFromProduct(product)}
                      inWishlist={wishlist.includes(product.id)}
                      onToggleWishlist={() => toggleWishlist(product.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          /* ── Normal mode (category/browse) ── */
          productsLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#c91c1c] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No Products Found</h3>
              <p className="text-gray-500 text-sm mt-1">Try a different category or check back soon.</p>
              <button onClick={() => { setSelectedCategory('all'); setVehicleFiltered(false); }} className="mt-4 bg-[#c91c1c] text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider">View All</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => addToCartFromProduct(product)}
                  inWishlist={wishlist.includes(product.id)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                />
              ))}
            </div>
          )
        )}
      </section>

      {/* 8. INSTAGRAM REELS SECTION */}
      {instagramReels.length > 0 && (
        <section className="bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">FOLLOW US</span>
              <h2 className="text-3xl font-bold text-white mt-1">FROM OUR INSTAGRAM</h2>
              <p className="text-gray-300 text-sm mt-2">@cartunez_hyd</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {instagramReels.map(reel => (
                <button
                  key={reel.id}
                  onClick={() => setPlayingReel(reel.shortcode)}
                  className="group relative rounded-xl overflow-hidden aspect-square shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <img
                    src={reel.thumbnail}
                    alt={reel.caption}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs line-clamp-2 font-medium">{reel.caption}</p>
                    <div className="flex items-center mt-1 text-gray-300 text-[10px]">
                      <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      <span>{reel.likes}</span>
                    </div>
                  </div>
                  {/* Play button overlay — always visible */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-gray-900 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-8">
              <a
                href="https://www.instagram.com/cartunez_hyd/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span>Follow @cartunez_hyd</span>
              </a>
            </div>
          </div>
        </section>
      )}
      {/* 8b. BLOG SECTION (fallback if no instagram) */}
      {instagramReels.length === 0 && blogPosts.length > 0 && (
        <section className="bg-gray-100 py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">INSIGHTS</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">FROM OUR BLOG</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {blogPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  {post.featured_image && (
                    <img src={imageUrl(post.featured_image)} alt={post.title} className="w-full h-40 object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-sm line-clamp-2">{post.title}</h3>
                    <p className="text-gray-500 text-xs mt-2 line-clamp-3">{post.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. FOOTER */}
      <footer id="footer" className="bg-black text-gray-400 py-16 px-4 md:px-8 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 select-none">
              <img src="/logo.png" alt="Car Tunez" className="h-10 w-10 object-contain rounded" />
              <span className="font-bold text-lg tracking-wider text-white">CAR TUNEZ</span>
            </div>
            <p className="leading-relaxed">Leading importer and online distributor of premium car accessories in India. Representing 40+ world-renowned names.</p>
            <div className="space-y-2 pt-2 text-gray-300">
              <div className="flex items-center space-x-2"><MapPin size={14} className="text-[#c91c1c]" /><span>Shop No 12, 13 Veer Hanuman Temple SP Road, Secunderabad</span></div>
              <div className="flex items-center space-x-2"><Phone size={14} className="text-[#c91c1c]" /><span>9949695030 / 7799695030</span></div>
              <div className="flex items-center space-x-2"><Mail size={14} className="text-[#c91c1c]" /><span>adnan@cartunez.in</span></div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#footer" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#footer" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#footer" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">Categories</h4>
            <ul className="space-y-2">
              {categories.map(c => (
                <li key={c.id}><button onClick={() => { setSelectedCategory(c.handle); setVehicleFiltered(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">{c.name}</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">Policies</h4>
            <ul className="space-y-2">
              <li><a href="#footer" className="hover:text-white transition-colors">Return & Refund Policy</a></li>
              <li><a href="#footer" className="hover:text-white transition-colors">Terms & Condition</a></li>
              <li><a href="#footer" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#footer" className="hover:text-white transition-colors">Shipping Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-6 text-center text-gray-500">
          © {new Date().getFullYear()} CarTunez India. All Rights Reserved.
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DRAWERS & MODALS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative bg-black text-white w-80 max-w-xs h-full flex flex-col p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Car Tunez" className="h-8 w-8 object-contain rounded" />
                <span className="font-bold text-sm tracking-wider text-white">CAR TUNEZ</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-col space-y-6 font-semibold uppercase tracking-wider text-sm">
              {navItems.map(item => (
                <button key={item.cat} onClick={() => { setSelectedCategory(item.cat); setVehicleFiltered(false); setIsSidebarOpen(false); }} className={`text-left py-2 border-b border-white/5 ${selectedCategory === item.cat ? 'text-[#c91c1c]' : 'hover:text-[#c91c1c]'}`}>{item.label}</button>
              ))}
            </div>
            <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center space-x-3 text-xs text-gray-400"><Phone size={14} className="text-[#c91c1c]" /><span>9949695030 / 7799695030</span></div>
              <div className="flex items-center space-x-3 text-xs text-gray-400"><Mail size={14} className="text-[#c91c1c]" /><span>adnan@cartunez.in</span></div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white text-black w-full max-w-md h-full flex flex-col p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-lg font-bold flex items-center space-x-2"><ShoppingCart size={20} /><span>CART ({itemCount})</span></h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
              {!cart?.items?.length ? (
                <div className="text-center py-20">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty.</p>
                </div>
              ) : cart.items.map((item: { id: string; thumbnail?: string; title: string; variant?: { title: string }; quantity: number; total: number }) => (
                <div key={item.id} className="flex space-x-4 border-b border-gray-100 pb-4">
                  {item.thumbnail && <img src={imageUrl(item.thumbnail)} alt={item.title} className="w-16 h-16 object-cover rounded" />}
                  <div className="flex-grow">
                    <div className="font-bold text-sm line-clamp-1">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.variant?.title}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2 border border-gray-200 rounded">
                        <button onClick={() => updateItem(item.id, item.quantity - 1)} className="px-2 py-0.5 text-gray-500 hover:text-black"><Minus size={12} /></button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateItem(item.id, item.quantity + 1)} className="px-2 py-0.5 text-gray-500 hover:text-black"><Plus size={12} /></button>
                      </div>
                      <div className="font-bold text-xs text-red-600">{formatPrice(item.total)}</div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 self-start p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            {cart?.items?.length ? (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-between text-base font-extrabold mb-4">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
                <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-[#c91c1c] hover:bg-red-700 text-white py-3 rounded text-xs font-bold uppercase tracking-widest shadow-lg">Proceed To Checkout</button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* WISHLIST DRAWER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsWishlistOpen(false)}></div>
          <div className="relative bg-white text-black w-full max-w-md h-full flex flex-col p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-lg font-bold flex items-center space-x-2"><Heart size={20} className="fill-red-600 text-red-600" /><span>WISHLIST ({wishlist.length})</span></h3>
              <button onClick={() => setIsWishlistOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto">
              {wishlist.length === 0 ? (
                <div className="text-center py-20"><Heart size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Your wishlist is empty.</p></div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map(id => {
                    const p = products.find(pr => pr.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex space-x-4 border-b border-gray-100 pb-4">
                        <img src={imageUrl(p.thumbnail)} alt={p.title} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-grow">
                          <div className="font-bold text-sm line-clamp-1">{p.title}</div>
                          <div className="font-bold text-xs text-red-600 mt-1">{p.variants?.[0]?.prices?.[0] ? formatPrice(p.variants[0].prices[0].amount) : 'Contact'}</div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button onClick={() => toggleWishlist(id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                          <button onClick={() => { addToCartFromProduct(p); toggleWishlist(id); }} className="bg-black hover:bg-[#c91c1c] text-white text-[9px] font-bold py-1.5 px-3 rounded uppercase">Add to Cart</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {qv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75" onClick={() => setActiveQuickView(null)}></div>
          <div className="relative bg-white text-black w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row max-h-[90vh]">
            <button onClick={() => setActiveQuickView(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black z-20 bg-white/80 rounded-full p-1.5 shadow"><X size={20} /></button>
            <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-6">
              <img src={imageUrl(qv.thumbnail)} alt={qv.title} className="max-h-[400px] w-auto object-contain rounded" />
            </div>
            <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mt-1">{qv.title}</h2>
                <div className="mt-4 text-2xl font-extrabold text-[#c91c1c]">
                  {qvSelectedVariant?.prices?.[0]?.amount ? formatPrice(qvSelectedVariant.prices[0].amount) : 'Contact for Price'}
                </div>
                <div className="w-full h-px bg-gray-200 my-6"></div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{qv.description}</p>
                {qv.options?.map(opt => (
                  <div key={opt.id} className="mb-6">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{opt.title}</label>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map(val => {
                        const label = val.title || val.id;
                        const isSelected = quickViewOptions[opt.id] === label;
                        return (
                          <button key={val.id} onClick={() => setQuickViewOptions(prev => ({ ...prev, [opt.id]: label }))} className={`px-4 py-2 rounded border text-xs font-semibold uppercase ${isSelected ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>{label}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-gray-200 flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded">
                  <button onClick={() => setQuickViewQty(q => Math.max(1, q - 1))} className="p-3 text-gray-500 hover:text-black"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-bold">{quickViewQty}</span>
                  <button onClick={() => setQuickViewQty(q => q + 1)} className="p-3 text-gray-500 hover:text-black"><Plus size={14} /></button>
                </div>
                <button onClick={handleQuickViewAdd} disabled={adding} className="flex-grow bg-black hover:bg-[#c91c1c] text-white py-3.5 rounded text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !orderPlaced && setIsCheckoutOpen(false)}></div>
          <div className="relative bg-white text-black w-full max-w-xl rounded-lg p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <button onClick={() => !orderPlaced && setIsCheckoutOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20} /></button>
            <h3 className="text-2xl font-bold border-b border-gray-100 pb-4 mb-6 flex items-center space-x-2"><ShoppingCart size={22} className="text-[#c91c1c]" /><span>Checkout</span></h3>
            {orderPlaced ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><Check size={36} className="animate-ping" /></div>
                <h4 className="text-xl font-bold">Order Placed Successfully!</h4>
                <p className="text-gray-500 text-sm">Thank you for shopping with Car Tunez. You will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!customer && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                        <input type="tel" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>
                  </>
                )}
                {customer && (
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                    Checking out as <span className="font-bold text-black">{customer.email}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</label>
                  <textarea rows={3} value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                    <input type="text" value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                    <input type="text" value={checkoutState} onChange={e => setCheckoutState(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-bold text-sm mb-3">Order Summary</h4>
                  {cart?.items?.map((item: { id: string; title: string; variant?: { title: string }; quantity: number; total: number }) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="text-gray-600">{item.title} {item.variant?.title ? `(${item.variant.title})` : ''} x{item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-extrabold text-red-600 mt-3 pt-3 border-t border-gray-200">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <button onClick={handleCheckout} disabled={adding || !checkoutEmail} className="w-full bg-[#c91c1c] hover:bg-red-700 text-white font-bold py-3 rounded text-xs uppercase tracking-widest shadow-lg mt-6 disabled:opacity-50">
                  {adding ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {/* REEL PLAYER MODAL */}
      {/* CHATBOT WIDGET */}
      <ChatBot />

      {playingReel && (
        <ReelPlayerModal shortcode={playingReel} onClose={() => setPlayingReel(null)} />
      )}


    </div>
  );
}
