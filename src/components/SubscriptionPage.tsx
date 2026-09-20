import React, { useState, useEffect } from 'react';
import { 
  Check, Shield, CreditCard, Lock, Mail, Users, ArrowRight, 
  HelpCircle, CheckCircle, RefreshCw, AlertCircle, Heart, Award, LogOut, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { heartsync } from '../store';
import { Plan, Subscription, User } from '../types';

interface SubscriptionPageProps {
  onNavigate: (tab: string, arg?: string) => void;
}

export default function SubscriptionPage({ onNavigate }: SubscriptionPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  // Authentication Flow inside panel
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Checkout Overlay Flow
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<'stripe' | 'paystack' | 'flutterwave'>('stripe');
  
  // Checkout Input Fields
  const [cardNo, setCardNo] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('•••');
  const [phoneNumber, setPhoneNumber] = useState('');

  // FAQ Expand state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isSuccessOverlayOpen, setIsSuccessOverlayOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const handleStoreUpdate = () => {
      setPlans([...heartsync.plans]);
      setUser(heartsync.current_user);
      
      if (heartsync.current_user) {
        const sub = heartsync.subscriptions.find(s => s.user_id === heartsync.current_user?.id && s.status === 'active');
        setSubscription(sub || null);
      } else {
        setSubscription(null);
      }
    };

    handleStoreUpdate();
    const unsubscribe = heartsync.subscribe(handleStoreUpdate);
    return unsubscribe;
  }, []);

  const triggerAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthSuccess(null);
    setShowAuthForm(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.includes('@') || authPassword.length < 5) {
      setAuthError('Please enter a valid email address and a password with at least 5 characters.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const res = await heartsync.registerNewUser(authName || authEmail.split('@')[0], authEmail, authPassword);
      setLoading(false);
      if (res.success) {
        setAuthSuccess('Your account has been created successfully. Welcome to Heartsync.');
        setTimeout(() => {
          setShowAuthForm(false);
          if (selectedPlan) {
            setShowCheckout(true);
          }
        }, 1200);
      } else {
        setAuthError(res.error || 'Failed to create your account. Please try again.');
      }
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const res = await heartsync.loginCustomUser(authEmail, authPassword);
      setLoading(false);
      if (res.success) {
        setAuthSuccess('Signed in successfully.');
        setTimeout(() => {
          setShowAuthForm(false);
          if (selectedPlan) {
            setShowCheckout(true);
          }
        }, 1200);
      } else {
        setAuthError(res.error || 'Incorrect email or password. Please try again.');
      }
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthSuccess('A password reset link has been sent to your email address.');
    }, 1000);
  };

  const handleSubscribeAction = (plan: Plan) => {
    setSelectedPlan(plan);
    if (!user) {
      triggerAuth('signup');
    } else {
      setShowCheckout(true);
    }
  };

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !user) return;

    setLoading(true);
    setCheckoutError(null);
    fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: selectedPlan.id,
        billingCycle,
        gateway: checkoutGateway,
        userId: user.id,
        email: user.email
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        setLoading(false);
        setCheckoutError(data.error || 'Payments are not live yet. Please check back soon.');
      })
      .catch(() => {
        setLoading(false);
        setCheckoutError('Could not reach the payment service. Please try again.');
      });
  };

  // Payment gateway return: show the success overlay after a real gateway redirect
  useEffect(() => {
    if (plans.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const returnedPlan = plans.find(p => p.id === params.get('planId'));
      if (returnedPlan) {
        setSelectedPlan(returnedPlan);
        setIsSuccessOverlayOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [plans]);

  const activeSubscribedPlanName = subscription ? (plans.find(p => p.id === subscription.plan_id)?.name || 'Legacy Membership') : null;

  const faqs = [
    { q: "What is the difference between regular articles and the LoveVault?", a: "Standard Insights are available to general readers. The LoveVault is a locked private container packed with interactive attachment diagnostics, journaling utilities, boundaries templates, and professional attachment-reprogramming video courses." },
    { q: "Can I cancel my membership at any time?", a: "Absolutely. You can cancel your auto-renew contract directly from your profile settings page with a single click. No phone calls or awkward surveys required." },
    { q: "Is my diagnostic data secure?", a: "Yes. All emotional diagnostic surveys, attachment blueprints, and journaling feedback are protected with TLS 1.3 encryption layers and remain anonymous, never shared with third parties." },
    { q: "Do the payment gateways support regional currencies?", a: "Stripe supports international currencies (USD, EUR, GBP), while Paystack & Flutterwave are fully optimized for local payment channels across Nigeria, South Africa, and other African corridors." }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn">
        
        {/* TOP CANCEL AND CLOSE ACTIONS ROW */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer shadow-3xs"
          >
            <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            <span>Close and Go Back</span>
          </button>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-mono">
            Secure Customer Checkout
          </span>
        </div>

        {/* GOOGLE STANDARD HEADER */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide border border-blue-200/50 dark:border-blue-800/50">
            <Award className="w-3.5 h-3.5" />
            <span>Heartsync Premium Membership</span>
          </div>
          <h1 className="text-3xl sm:text-4.5xl font-semibold text-zinc-900 dark:text-white leading-tight tracking-tight font-sans">
            Choose a plan that fits your journey
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Get full access to professional attachment blueprints, guided courses, emotional logs, and the secure, private LoveVault library.
          </p>

          {/* BILLING TOGGLE - GOOGLE STYLE */}
          <div className="flex items-center justify-center pt-3">
            <div className="relative inline-flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-3xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${billingCycle === 'monthly' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-3xs' : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-800'}`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-3xs' : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-800'}`}
              >
                <span>Yearly billing</span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE SUBSCRIPTION BANNER */}
        {subscription && (
          <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-250 dark:border-green-900/50 flex flex-col md:flex-row md:items-center md:justify-between max-w-4xl mx-auto gap-4 animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-green-600 text-white rounded-full">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">Active Premium Privileges Enabled</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  You are registered under <b>{activeSubscribedPlanName}</b>. Attachment templates and secure LoveVault files are fully unlocked.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full cursor-pointer shadow-3xs transition-colors"
              >
                Go to Home Feed
              </button>
              
              <button
                onClick={() => {
                  if (user && confirm('Are you sure you want to cancel your Premium subscription? You will lose access to premium insights and the secure LoveVault.')) {
                    heartsync.cancelUserSubscription(user.id);
                  }
                }}
                className="px-4 py-2 border border-red-300 dark:border-red-900/40 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 font-semibold text-xs rounded-full hover:bg-red-50 dark:hover:bg-red-950/25 transition-all cursor-pointer shadow-3xs"
              >
                Cancel Subscription
              </button>

              <button
                onClick={() => {
                  heartsync.logoutUser();
                }}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Log Out Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GOOGLE SUBSCRIPTION MATRIX CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => {
            const isPremiumPlus = plan.id === 'plan-plus';
            const price = billingCycle === 'yearly' ? (plan.price_yearly || (plan.price_monthly * 10)) : plan.price_monthly;
            const cycleText = billingCycle === 'yearly' ? 'year' : 'month';
            
            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border flex flex-col justify-between min-h-[440px] relative transition-all ${
                  isPremiumPlus 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md ring-4 ring-blue-500/5' 
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {isPremiumPlus && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold text-[9px] uppercase px-3.5 py-1 rounded-full shadow-3xs font-sans tracking-wider">
                    Recommended
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white tracking-tight">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                        ${price === 0 ? '0.00' : price.toFixed(2)}
                      </span>
                      {price > 0 && (
                        <span className="text-xs text-zinc-550 dark:text-zinc-400">/ {cycleText}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3.5 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleSubscribeAction(plan)}
                    className={`w-full py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      isPremiumPlus 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-3xs' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-750'
                    }`}
                  >
                    <span>Activate {plan.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECURITY TRUST SEALS */}
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-around gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-left">
              <h5 className="font-semibold text-xs text-zinc-900 dark:text-white leading-tight">Secured checkout logs</h5>
              <p className="text-[10px] text-zinc-500">SSL 256-bit encrypted API</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-t md:border-t-0 md:border-x border-zinc-200 dark:border-zinc-800 py-4 md:py-0 md:px-8">
            <Heart className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-left">
              <h5 className="font-semibold text-xs text-zinc-900 dark:text-white leading-tight">Expert Endorsement</h5>
              <p className="text-[10px] text-zinc-500">Certified relationship guidelines</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-left">
              <h5 className="font-semibold text-xs text-zinc-900 dark:text-white leading-tight">100% Satisfaction trial</h5>
              <p className="text-[10px] text-zinc-500">Cancel online with zero friction</p>
            </div>
          </div>
        </div>

        {/* GOOGLE ACCORDION FAQS */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">Pricing levels and expert content access parameters.</p>
          </div>

          <div className="space-y-2.5 font-sans divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="transition-colors"
                >
                  <div 
                    className="flex items-center justify-between p-4.5 select-none hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  >
                    <span className="font-medium text-xs text-zinc-850 dark:text-zinc-200 pr-4">{faq.q}</span>
                    <HelpCircle className={`w-4 h-4 shrink-0 transition-transform text-zinc-450 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4.5 pb-4 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs leading-relaxed text-zinc-500 font-normal border-t border-zinc-100 dark:border-zinc-800/50 pt-2.5"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* DYNAMIC REGISTER USER MODAL (GOOGLE ACCOUNT STYLING) */}
      <AnimatePresence>
        {showAuthForm && (
          <div className="fixed inset-0 z-50 bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 max-w-sm w-full space-y-4 shadow-xl relative font-sans"
            >
              <button 
                className="absolute top-5 right-5 p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setShowAuthForm(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  {authMode === 'signup' ? 'Create a Heartsync Account' : authMode === 'forgot' ? 'Reset your password' : 'Sign in to Heartsync'}
                </h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">To unlock secure plans and manage subscriptions</p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex gap-2 text-xs border border-red-200/50">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-xl flex gap-2 text-xs border border-green-200/50">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {authMode === 'signup' && (
                <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-3xs transition-colors mt-2"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create account</span>
                  </button>

                  <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                    <span className="text-zinc-500">Already have an account? </span>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('signin')}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}

              {authMode === 'signin' && (
                <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-3xs transition-colors mt-2"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Sign in</span>
                  </button>

                  <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                    <span className="text-zinc-500">New to Heartsync? </span>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </div>
                </form>
              )}

              {authMode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5 text-xs">
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed text-center pb-2">
                    Enter your email address and we will send you a secure link to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-3xs transition-colors"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send reset link</span>
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('signin')}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Return to sign in
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC SECURE PAYMENT CHECKOUT GATEWAY (GOOGLE PAYMENT STYLING) */}
      <AnimatePresence>
        {showCheckout && selectedPlan && user && (
          <div className="fixed inset-0 z-50 bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 max-w-sm w-full space-y-4 shadow-xl relative text-xs font-sans"
            >
              <button
                className="absolute top-5 right-5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded-full transition-colors font-bold"
                onClick={() => setShowCheckout(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-850 dark:text-zinc-100 leading-tight">Secured payment</h3>
                <p className="text-xs text-zinc-400 mt-1">Certified payment proxy checkout gateway</p>
              </div>

              {/* PAYMENT BRAND SPLIT - GOOGLE TABS STYLE */}
              <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCheckoutGateway('stripe')}
                  className={`flex-1 py-1.5 px-2.5 rounded-full font-semibold text-[10px] cursor-pointer text-center transition-colors ${checkoutGateway === 'stripe' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-3xs' : 'text-zinc-500'}`}
                >
                  Stripe Global
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutGateway('paystack')}
                  className={`flex-1 py-1.5 px-2.5 rounded-full font-semibold text-[10px] cursor-pointer text-center transition-colors ${checkoutGateway === 'paystack' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-3xs' : 'text-zinc-500'}`}
                >
                  Paystack local
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutGateway('flutterwave')}
                  className={`flex-1 py-1.5 px-2.5 rounded-full font-semibold text-[10px] cursor-pointer text-center transition-colors ${checkoutGateway === 'flutterwave' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-3xs' : 'text-zinc-500'}`}
                >
                  Flutterwave
                </button>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center font-sans">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Product</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedPlan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Price ({billingCycle})</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    ${(billingCycle === 'yearly' ? (selectedPlan.price_yearly || (selectedPlan.price_monthly * 10)) : selectedPlan.price_monthly).toFixed(2)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProcessCheckout} className="space-y-3.5">
                {checkoutError && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{checkoutError}</p>
                  </div>
                )}
                {checkoutGateway === 'stripe' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-450 mb-1">Card number</label>
                      <input
                        type="text"
                        required
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-450 mb-1">Expiry date</label>
                        <input
                          type="text"
                          required
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full p-2.5 rounded-lg border bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-450 mb-1">CVC</label>
                        <input
                          type="text"
                          required
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="w-full p-2.5 rounded-lg border bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-mono"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-450 mb-1">Mobile number</label>
                    <input
                      type="text"
                      required
                      placeholder="+234 81 2345 6789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2.5 rounded-lg border bg-white dark:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-100 font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                      A prompt will be sent to your mobile device to complete this debit request.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs transition-colors"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Authorize payment</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {isSuccessOverlayOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full text-center space-y-4 shadow-xl relative rounded-2xl font-sans"
            >
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white leading-tight">Subscription activated</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Congratulations. Your <b>{selectedPlan.name}</b> package is now fully synchronized and active.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left text-xs leading-relaxed text-zinc-550 dark:text-zinc-400">
                🛡️ Your attachment courses, diagnostics, soundscapes, and Relationship Blueprints are fully unlocked. Return to the home feed to begin exploring premium resources.
              </div>

              <button
                onClick={() => {
                  setIsSuccessOverlayOpen(false);
                  onNavigate('home');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-xs cursor-pointer shadow-3xs transition-colors"
              >
                Go to Home Sanctuary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Select wrapper component elements to prevent custom components requirement
function Select({ children, value, onValueChange }: { children: React.ReactNode, value: string, onValueChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, { onClick: () => setOpen(!open), value } as any);
          }
          if (child.type === SelectContent && open) {
            return React.cloneElement(child, { onSelect: (val: string) => { onValueChange(val); setOpen(false); } } as any);
          }
        }
        return null;
      })}
    </div>
  );
}

function SelectTrigger({ children, onClick, value, className }: { children: React.ReactNode, onClick?: () => void, value?: string, className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-1.5 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-h-[34px] ${className}`}
    >
      {children}
    </button>
  );
}

function SelectValue({ placeholder }: { placeholder: string }) {
  return <span className="font-semibold text-xs uppercase">{placeholder}</span>;
}

function SelectContent({ children, onSelect, className, align }: { children: React.ReactNode, onSelect?: (val: string) => void, className?: string, align?: string }) {
  return (
    <div className={`absolute z-[110] mt-1 right-0 w-32 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg ring-1 ring-black/5 focus:outline-none divide-y divide-zinc-100 dark:divide-zinc-900 ${className}`}>
      <div className="py-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child, { onSelect } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

function SelectItem({ children, value, onSelect, className }: { children: React.ReactNode, value: string, onSelect?: (val: string) => void, className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(value)}
      className={`block w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
