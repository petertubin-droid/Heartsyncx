import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ShieldCheck, HelpCircle, Loader2, CreditCard, 
  Award, ArrowRight, Lock, Key, Mail, User, Info 
} from 'lucide-react';
import { Plan, User as StoreUser } from '../types';
import { heartsync } from '../store';

interface PricingPageProps {
  onNavigate: (tab: string, arg?: string) => void;
}

export default function SubscriptionPricingPage({ onNavigate }: PricingPageProps) {
  const [plans, setPlans] = useState<Plan[]>(heartsync.getPlans());
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentUser, setCurrentUser] = useState<StoreUser | null>(heartsync.current_user);

  // Checkout workflow states
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'paystack' | 'flutterwave'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCVC, setCardCVC] = useState('345');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Quick Inline Register or Login to handle checkout instantly
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [checkoutPassword, setCheckoutPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => {
      setPlans([...heartsync.getPlans()]);
      setCurrentUser(heartsync.current_user);
    });
    return unsub;
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentSuccess(false);
    setProcessingPayment(false);
    setAuthError(null);
    if (!heartsync.current_user) {
      setCheckoutMode('register');
    } else {
      setCheckoutMode('guest');
    }
  };

  const handleCheckoutAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (checkoutMode === 'login') {
      try {
        heartsync.loginUser(checkoutEmail);
      } catch (err: any) {
        setAuthError(err.message || 'Email not found.');
      }
    } else if (checkoutMode === 'register') {
      if (!checkoutName.trim() || !checkoutEmail.trim()) {
        setAuthError('Please fill out your legal name and email.');
        return;
      }
      heartsync.registerUser(checkoutName.trim(), checkoutEmail.trim());
    }
  };

  const handleProcessPayment = () => {
    const userToCharge = heartsync.current_user;
    if (!userToCharge) {
      setAuthError('Authentication required to process subscriptions.');
      return;
    }

    if (userToCharge.is_suspended) {
      setAuthError('This account is suspended and cannot subscribe.');
      return;
    }

    setProcessingPayment(true);
    
    // Simulate real gateway latency checkouts
    setTimeout(() => {
      const isYearly = billingCycle === 'yearly';
      const amountCharged = isYearly ? (selectedPlan?.price_yearly || 199.9) : (selectedPlan?.price_monthly || 19.9);
      
      // 1. Generate active subscription record
      const subId = `sub-act-${Date.now()}`;
      const periodDays = isYearly ? 365 : 30;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + periodDays);

      heartsync.addSubscription({
        id: subId,
        user_id: userToCharge.id,
        user_email: userToCharge.email,
        plan_id: selectedPlan!.id,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        auto_renew: true,
        is_trial: false
      });

      // 2. Generate Payment transaction ledger log
      heartsync.addPayment({
        id: `pay-ref-${Date.now()}`,
        user_id: userToCharge.id,
        subscription_id: subId,
        user_email: userToCharge.email,
        amount: amountCharged,
        currency: 'usd',
        gateway: paymentGateway,
        status: 'succeeded',
        created_at: new Date().toISOString()
      });

      setProcessingPayment(false);
      setPaymentSuccess(true);

      // Auto redirect back to premium tools
      setTimeout(() => {
        setSelectedPlan(null);
        onNavigate('home');
      }, 2500);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 font-sans text-xs text-left" id="pricing-screen-wrapper">
      
      {/* HEADER SECTION WITH HERO COPY */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full font-bold uppercase tracking-widest text-[9px] border border-rose-100 dark:border-rose-900/30">
          <Award className="w-3.5 h-3.5 text-rose-500" />
          <span>HEARTSYNC PREMIUM BENEFITS</span>
        </div>
        <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white leading-tight">
          Recapture Emotional Synced Clarity
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
          Unlock standard relationship guides, deep connection worksheets, interactive journals, and premium AI relationship diagnostics created by relationship coaching experts.
        </p>

        {/* BILLING CYCLE SELECTOR BUTTONS */}
        <div className="flex items-center justify-center pt-3">
          <div className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200/50 flex gap-0.5 relative z-10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs border border-zinc-150/10' : 'text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-350'}`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs border border-zinc-150/10' : 'text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-350'}`}
            >
              <span>Yearly billing</span>
              <span className="bg-emerald-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">SAVE 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* THREE TIER PRICING CARDS LAYOUT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map(plan => {
          const isPro = plan.badge?.toLowerCase().includes('popular') || plan.name.toLowerCase().includes('premium');
          const isFree = plan.price_monthly === 0;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between min-h-[440px] relative transition-all duration-300 bg-white dark:bg-zinc-900 shadow-lg ${isPro ? 'border-rose-500 ring-1 ring-rose-500/10 scale-102 z-10' : 'border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white font-bold text-[8px] font-mono tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                    {isPro && <Award className="w-4 h-4 text-rose-550 fill-rose-550" />}
                    <span>{plan.name}</span>
                  </h3>
                  
                  <div className="flex items-baseline gap-1.5 mt-3.5">
                    <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      {isFree ? 'Free' : `$${(billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly).toFixed(2)}`}
                    </span>
                    {!isFree && (
                      <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">/ Mo</span>
                    )}
                  </div>
                  {!isFree && (
                    <span className="block text-[9px] text-rose-500 font-bold tracking-wide mt-1.5 font-mono">
                      {billingCycle === 'yearly' ? `Billed yearly: $${plan.price_yearly.toFixed(2)} / yr` : 'Renewable monthly'}
                    </span>
                  )}
                  {plan.trial_days !== undefined && plan.trial_days > 0 && (
                    <span className="block text-[9px] text-emerald-500 font-bold uppercase tracking-widest font-mono mt-1">
                      🛡️ {plan.trial_days}-Day Free Trial Included
                    </span>
                  )}
                </div>

                <ul className="space-y-3.5 border-t pt-5">
                  {plan.features.map((feat, index) => (
                    <li key={index} className="flex gap-2.5 items-start text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 border-t pt-5">
                {currentUser?.plan_id === plan.id ? (
                  <div className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-bold rounded-xl text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Your Current Subscription</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-2.5 rounded-xl text-[11px] font-bold cursor-pointer tracking-wider uppercase transition-all duration-205 flex items-center justify-center gap-1.5 ${isPro ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-md hover:opacity-90' : 'bg-white border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200'}`}
                  >
                    <span>{isFree ? 'Browse Free content' : 'Unlock premium pass'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRUST FACTORS ACCORDION BANNER */}
      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150/60 text-center space-y-4 max-w-3xl mx-auto">
        <h4 className="font-serif font-bold text-xs text-zinc-700 dark:text-zinc-300">HeartSync SaaS Escrow Gurantee</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-sans">
          <div className="space-y-1">
            <span className="block font-bold text-zinc-800 dark:text-zinc-200">Instant Access</span>
            <span className="block text-[10px] text-zinc-400">Upgrade processes instantly with automated license sync keys.</span>
          </div>
          <div className="space-y-1 border-y sm:border-y-0 sm:border-x py-3 sm:py-0">
            <span className="block font-bold text-zinc-800 dark:text-zinc-200">Cancel Anytime</span>
            <span className="block text-[10px] text-zinc-400">Manage billing directly inside your member directory controls.</span>
          </div>
          <div className="space-y-1">
            <span className="block font-bold text-zinc-800 dark:text-zinc-200">256-Bit Escrow Security</span>
            <span className="block text-[10px] text-zinc-400">Sandbox APIs completely shield transaction detail records.</span>
          </div>
        </div>
      </div>

      {/* CHECKOUT SYSTEM INTEGRATION MODAL OVERLAY */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 rounded-3xl p-6 shadow-2xl max-w-md w-full font-sans text-xs relative animate-scaleUp text-left space-y-5">
            <span 
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-rose-500 cursor-pointer"
            >
              Close
            </span>

            <div className="border-b pb-3 text-center">
              <span className="inline-block bg-rose-500 text-white text-[8px] font-mono tracking-widest uppercase font-bold px-2.0 py-0.5 rounded-full mb-1">SECURE CHECKOUT</span>
              <h3 className="font-serif font-bold text-sm">HeartSync Premium License Integration</h3>
              <p className="text-[10px] text-rose-500 font-bold mt-1">Tier: {selectedPlan.name} • {billingCycle.toUpperCase()}</p>
            </div>

            {/* Step A: Checkout Authentication (If Guest user) */}
            {!currentUser ? (
              <form onSubmit={handleCheckoutAuth} className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] leading-relaxed font-semibold text-rose-700">
                  ⚡ Authenticate your user profile below to authorize immediate premium content sync across devices.
                </div>

                <div className="flex bg-zinc-100 p-1 rounded-xl border">
                  <button 
                    type="button"
                    onClick={() => { setCheckoutMode('register'); setAuthError(null); }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg ${checkoutMode === 'register' ? 'bg-white text-rose-500 shadow-xs' : 'text-zinc-500'}`}
                  >
                    Create Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setCheckoutMode('login'); setAuthError(null); }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg ${checkoutMode === 'login' ? 'bg-white text-rose-500 shadow-xs' : 'text-zinc-500'}`}
                  >
                    Sign In instead
                  </button>
                </div>

                {checkoutMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-8 pr-3 py-2 border rounded-xl outline-none"
                      />
                      <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-8 pr-3 py-2 border rounded-xl outline-none"
                    />
                    <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </div>

                {authError && <div className="text-[10px] font-bold text-rose-500">{authError}</div>}

                <button 
                  type="submit"
                  className="w-full py-2 bg-zinc-900 text-white hover:opacity-90 font-bold text-xs rounded-xl"
                >
                  Confirm Profile Details
                </button>
              </form>
            ) : (
              /* Step B: Secure Payment Details Interface */
              <div className="space-y-4">
                {paymentSuccess ? (
                  <div className="text-center py-6 space-y-4 font-sans uppercase-none animate-scaleUp">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                      <ShieldCheck className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-zinc-900">Transaction Approved!</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Generating premium metadata license. Connecting Heartsync...</p>
                    </div>
                    <div className="text-[10px] text-emerald-500 font-bold">Welcome to HeartSync Premium, {currentUser.name}!</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User identifier disclaimer */}
                    <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center justify-between font-sans">
                      <div>
                        <span className="block font-bold text-zinc-700">Billing Profile ID:</span>
                        <span className="block text-[10px] text-zinc-400 font-mono select-all select-none leading-none">{currentUser.email}</span>
                      </div>
                      <span className="text-[10px] text-rose-500 font-bold">Active user</span>
                    </div>

                    {/* Interactive Gateway selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Payment Gateway Channel</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentGateway('stripe')}
                          className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${paymentGateway === 'stripe' ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 'border-zinc-200'}`}
                        >
                          Stripe (SaaS)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentGateway('paystack')}
                          className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${paymentGateway === 'paystack' ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 'border-zinc-200'}`}
                        >
                          Paystack (Card)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentGateway('flutterwave')}
                          className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${paymentGateway === 'flutterwave' ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 'border-zinc-200'}`}
                        >
                          Flutterwave
                        </button>
                      </div>
                    </div>

                    {/* Credit Card credential Form */}
                    <div className="space-y-3 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-100">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">Cardholder Details</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled
                            value={currentUser.name}
                            className="w-full bg-white border rounded-xl p-2 font-bold outline-none leading-none scale-100"
                          />
                          <CreditCard className="absolute right-2.5 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">Card Number</label>
                        <input 
                          type="text" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-white border rounded-xl p-2.5 font-mono text-xs focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">Expiry</label>
                          <input 
                            type="text" 
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2 font-mono text-center focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">CVC Code</label>
                          <input 
                            type="text" 
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2 font-mono text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {authError && <div className="text-[10px] font-bold text-rose-500 text-center">{authError}</div>}

                    {/* Checkout CTA */}
                    <button
                      type="button"
                      disabled={processingPayment}
                      onClick={handleProcessPayment}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:opacity-90 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Contacting Sandbox API Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Authorize Pay Total ${ (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly).toFixed(2) } USD
                          </span>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center text-[9px] text-zinc-400 flex items-center justify-center gap-1">
                      <Info className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Secured connection to testing Sandbox gateway servers.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
