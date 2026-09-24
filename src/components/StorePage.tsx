/** StorePage: the public digital storefront.
 *
 * Backed by the REAL digital_products DB table (GET /api/digital-products),
 * checkout via the verified-webhook-only order flow
 * (POST /api/digital-products/checkout) and token redemption through the
 * RPC-guarded download route. All storefront chrome is translated through
 * the i18n dictionary; product copy follows the server-side AI translation
 * of the site content manifest (translatedDigitalProductFields prop).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { getTranslation, Language } from '../utils/i18n';
import { Heart, Download, Sparkles, ShieldCheck, X, BookOpen } from 'lucide-react';

export interface StorePageProps {
  lang: string;
  showToast: (msg: string) => void;
  translatedDigitalProductFields?: Record<string, any>;
  initialToken?: string;
}

export default function StorePage({ lang, showToast, translatedDigitalProductFields, initialToken }: StorePageProps) {
  const L = lang as Language;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [gateway, setGateway] = useState<'stripe' | 'paystack'>('stripe');
  const [paying, setPaying] = useState(false);
  const [gatewayError, setGatewayError] = useState('');

  const [token, setToken] = useState(initialToken || '');
  const [redeemResult, setRedeemResult] = useState<any | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/digital-products');
      const data = await res.json();
      if (res.ok && data.success) setProducts(data.products || []);
    } catch {
      // network failure: empty catalog shows the honest empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const redeem = useCallback(async (rawToken: string) => {
    const clean = rawToken.trim();
    if (!clean) return;
    setRedeeming(true);
    setRedeemError('');
    setRedeemResult(null);
    try {
      const res = await fetch(`/api/digital-products/download/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemResult(data);
      } else {
        setRedeemError(getTranslation('invalidToken', L));
      }
    } catch {
      setRedeemError(getTranslation('invalidToken', L));
    } finally {
      setRedeeming(false);
    }
  }, [L]);

  // Auto-redeem when the buyer lands from the delivery email link
  // (/?store=redeem&token=...) - no extra click needed.
  useEffect(() => {
    if (initialToken) redeem(initialToken);
  }, [initialToken, redeem]);

  const startCheckout = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@')) {
      setGatewayError(getTranslation('checkoutEmail', L));
      return;
    }
    setPaying(true);
    setGatewayError('');
    try {
      const res = await fetch('/api/digital-products/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: checkoutProduct.id, userEmail: cleanEmail, gateway })
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return; // leaving for the gateway
      }
      if (res.status === 501) {
        setGatewayError(getTranslation('gatewaysPending', L));
        return;
      }
      setGatewayError(data.error || getTranslation('gatewaysPending', L));
    } catch {
      setGatewayError(getTranslation('gatewaysPending', L));
    } finally {
      setPaying(false);
    }
  };

  const withTranslation = (p: any) => ({
    ...p,
    ...((translatedDigitalProductFields && translatedDigitalProductFields[p.id]) || {})
  });
  const displayProducts = products.map(withTranslation);
  const featured = displayProducts.filter((p: any) => p.is_featured);
  const rest = displayProducts.filter((p: any) => !p.is_featured);

  const renderCard = (p: any) => {
    const price = p.salePrice ?? p.sale_price ?? null;
    const basePrice = p.price;
    return (
      <div key={p.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs flex flex-col group hover:shadow-md transition-shadow">
        {p.coverImage || p.cover_image ? (
          <img src={p.coverImage || p.cover_image} alt={p.title} className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="w-full h-44 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
          </div>
        )}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-rose-500 font-bold">{p.category}</span>
            {p.is_featured && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
                <Sparkles className="w-2.5 h-2.5" />{getTranslation('featuredBadge', L)}
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white leading-tight">{p.title}</h3>
          {p.subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{p.subtitle}</p>}
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <span className="font-serif text-xl font-extrabold text-rose-600 dark:text-rose-400">
              ${price ?? basePrice}
              {price !== null && <s className="text-xs text-zinc-400 font-sans ml-1.5">${basePrice}</s>}
            </span>
            <button
              onClick={() => { setCheckoutProduct(p); setGatewayError(''); }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold cursor-pointer shadow-xs transition-colors"
            >
              {getTranslation('buyNow', L)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
          <Heart className="w-3 h-3 fill-current" /> Heartsync
        </span>
        <h1 className="font-serif font-black text-4xl lg:text-5xl text-zinc-900 dark:text-white tracking-tight">
          {getTranslation('storeHeroTitle', L)}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {getTranslation('storeHeroSubtitle', L)}
        </p>
      </div>

      {/* Catalog */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <p className="text-sm text-zinc-400">{getTranslation('storeEmpty', L)}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {featured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{featured.map(renderCard)}</div>
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{rest.map(renderCard)}</div>
          )}
        </div>
      )}

      {/* Redeem */}
      <div className="max-w-xl mx-auto border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{getTranslation('redeemTitle', L)}</h3>
        </div>
        <p className="text-xs text-zinc-400">{getTranslation('redeemSubtitle', L)}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={token}
            onChange={e => { setToken(e.target.value); setRedeemResult(null); setRedeemError(''); }}
            placeholder={getTranslation('redeemPlaceholder', L)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <button
            onClick={() => redeem(token)}
            disabled={redeeming || !token.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-bold cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            {redeeming ? '...' : getTranslation('redeemBtn', L)}
          </button>
        </div>
        {redeemError && <p className="text-xs text-rose-500 font-semibold">{redeemError}</p>}
        {redeemResult && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
            <p className="text-xs text-zinc-700 dark:text-zinc-200 font-semibold">
              {redeemResult.productTitle} - {getTranslation('downloadNow', L)}:
            </p>
            <a
              href={redeemResult.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => showToast(getTranslation('checkoutSuccess', L))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />{getTranslation('downloadNow', L)}
            </a>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !paying && setCheckoutProduct(null)}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">{getTranslation('checkoutTitle', L)}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{checkoutProduct.title}</p>
              </div>
              <button onClick={() => setCheckoutProduct(null)} disabled={paying} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center py-2 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <span className="font-serif text-3xl font-black text-rose-600 dark:text-rose-400">
                ${(checkoutProduct.salePrice ?? checkoutProduct.sale_price ?? checkoutProduct.price)}
              </span>
              {(checkoutProduct.salePrice ?? checkoutProduct.sale_price) != null && (
                <s className="ml-2 text-sm text-zinc-400">${checkoutProduct.price}</s>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{getTranslation('checkoutEmail', L)}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="reader@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{getTranslation('checkoutGateway', L)}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['stripe', 'paystack'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGateway(g)}
                    className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${gateway === g ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                  >
                    {g === 'stripe' ? 'Stripe' : 'Paystack'}
                  </button>
                ))}
              </div>
            </div>
            {gatewayError && <p className="text-xs text-rose-500 font-semibold leading-snug">{gatewayError}</p>}
            <button
              onClick={startCheckout}
              disabled={paying}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              {paying ? '...' : getTranslation('payBtn', L)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
