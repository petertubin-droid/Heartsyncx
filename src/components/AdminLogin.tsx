import React, { useState, useEffect } from 'react';
import { heartsync } from '../store';
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, 
  CheckCircle, ArrowRight, RefreshCw, User, UserPlus, Info,
  Shield, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminLoginProps {
  onNavigate: (tab: string, arg?: string) => void;
  onSuccess: () => void;
}

export default function AdminLogin({ onNavigate, onSuccess }: AdminLoginProps) {
  // Modes: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'signin'>('signin');
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  
  // First-Run Setup Wizard States
  const [isSetupWizard, setIsSetupWizard] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Registration mode fetched from database ('open', 'invite', 'manual')
  const [regMode, setRegMode] = useState<string>('open');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Form Inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status and feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(heartsync.current_user);

  // Clean up any residual diagnostic or lockout local storage keys on mount
  useEffect(() => {
    localStorage.removeItem('hs_diag_visible');
    localStorage.removeItem('hs_login_disabled');
    localStorage.removeItem('hs_force_local_sandbox');
    
    // Verify whether any administrators exist (First-run Setup detection)
    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        if (res.ok) {
          const data = await res.json();
          if (data.hasAdmins === false) {
            setIsSetupWizard(true);
          }
        }
      } catch (err) {
        console.warn('Failed to check first-run setup wizard status:', err);
      } finally {
        setCheckingSetup(false);
      }
    };

    // Fetch site registration mode from database
    const fetchRegMode = async () => {
      if (heartsync.supabase) {
        try {
          const { data } = await heartsync.supabase
            .from('site_settings')
            .select('admin_registration_mode')
            .eq('id', 'singleton')
            .maybeSingle();
          if (data && data.admin_registration_mode) {
            setRegMode(data.admin_registration_mode);
          }
        } catch (e) {
          console.warn('Failed to fetch admin registration mode:', e);
        } finally {
          setIsLoadingSettings(false);
        }
      } else {
        setIsLoadingSettings(false);
      }
    };

    checkSetupStatus();
    fetchRegMode();
  }, []);

  const handleSetupWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      handleError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      handleError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      handleError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      handleError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit registration payload to custom secure server-side setup endpoint
      const res = await fetch('/api/setup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to register administrative account on server.');
      }

      // 2. Perform authentic client-side login session establishment via Supabase Auth
      if (heartsync.supabase) {
        let activeUserId: string | null = resData.user?.id || null;
        let profile = null;

        try {
          const { data: authData, error: authError } = await heartsync.supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });

          if (!authError && authData.user) {
            activeUserId = authData.user.id;
          } else {
            console.warn('Client-side signInWithPassword notice:', authError?.message);
          }
        } catch (e) {
          console.warn('Supabase auth sign in warning:', e);
        }

        if (activeUserId) {
          try {
            const { data: p } = await heartsync.supabase
              .from('profiles')
              .select('*')
              .eq('id', activeUserId)
              .maybeSingle();
            if (p) profile = p;
          } catch (e) {
            console.warn('Profile fetch warning:', e);
          }
        }

        // Initialize user store representation
        heartsync.current_user = {
          id: profile?.id || activeUserId || 'admin-root',
          email: profile?.email || cleanEmail,
          role: 'admin',
          name: profile?.name || profile?.full_name || cleanName || cleanEmail.split('@')[0],
          avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          bio: profile?.bio || 'Master Administrator',
          created_at: profile?.created_at || new Date().toISOString()
        };

        heartsync.logAction('Admin First-Run Setup Session Established', `Email: ${cleanEmail}`);
        heartsync.saveState();
        heartsync.triggerUpdate();

        handleSuccess('Master Admin profile registered successfully! Opening Console...');
        setIsSetupWizard(false);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        // Fallback for store user creation
        heartsync.loginUser(cleanEmail, 'admin');
        handleSuccess('Master Admin profile registered successfully! Opening Console...');
        setIsSetupWizard(false);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      console.warn('⚡ Setup wizard error:', err.message);
      handleError(err.message || 'An unexpected error occurred during first-run initialization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subscribe to Heartsync store updates
  useEffect(() => {
    const unsubscribe = heartsync.subscribe(() => {
      setCurrentUser(heartsync.current_user);
    });
    return unsubscribe;
  }, []);

  // Sync state if they are already logged in as authorized admins
  useEffect(() => {
    if (currentUser && ['admin', 'author', 'editor', 'moderator'].includes(currentUser.role || '')) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, onSuccess]);

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
  };

  // --- CONTINUE WITH GOOGLE (OAuth) ---
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!heartsync.supabase) {
      handleError('Connection failed: Supabase client is not configured.');
      return;
    }
    try {
      const { error } = await heartsync.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });
      if (error) {
        if (/provider.*not (enabled|configured)|unsupported provider|bad local/i.test(error.message)) {
          handleError('Google sign-in is not configured yet. Enable the Google provider in the Supabase Dashboard (Authentication → Providers → Google) with your Google OAuth client ID and secret, then try again.');
        } else {
          handleError(error.message);
        }
      }
      // On success the browser redirects to Google and back to /admin - 
      // the OAuth-return effect below completes the session.
    } catch (err: any) {
      handleError(err?.message || 'Google sign-in failed to start.');
    }
  };

  // --- OAUTH RETURN HANDLER ---
  // Completes Google OAuth round-trips: on returning to /admin with a
  // session, verify admin permissions via the authoritative sync-profile
  // endpoint and enter the console. Google sign-ups also take part in the
  // first-admin election (no administrator exists yet = this account
  // becomes THE admin).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!heartsync.supabase) return;
      try {
        const { data: { session } } = await heartsync.supabase.auth.getSession();
        if (!session?.user || cancelled) return;
        const cleanEmail = (session.user.email || '').toLowerCase().trim();
        const syncRes = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: session.user.id,
            email: cleanEmail,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || cleanEmail.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
          })
        });
        if (!syncRes.ok) {
          const errBody = await syncRes.json().catch(() => ({}));
          await heartsync.supabase.auth.signOut();
          if (!cancelled) handleError(errBody.error || 'Failed to verify account permissions.');
          return;
        }
        const syncData = await syncRes.json();
        const profile = syncData.profile;
        const adminRoles = ['admin', 'Super Admin', 'Admin', 'editor', 'author', 'moderator'];
        if (profile && adminRoles.includes(profile.role) && !profile.is_suspended && profile.status !== 'pending') {
          heartsync.current_user = {
            id: profile.id,
            email: profile.email || cleanEmail,
            role: (profile.role === 'Super Admin' || profile.role === 'Admin' ? 'admin' : profile.role) as any,
            name: profile.name || profile.full_name || cleanEmail.split('@')[0],
            avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            bio: profile.bio || '',
            created_at: profile.created_at
          };
          heartsync.logAction('Google Admin Login Session', `Email: ${cleanEmail}`);
          heartsync.saveState();
          heartsync.triggerUpdate();
          if (!cancelled) onSuccess();
        } else if (profile) {
          await heartsync.supabase.auth.signOut();
          if (!cancelled) handleError('Access denied: This portal is reserved for administrators only.');
        } else {
          await heartsync.supabase.auth.signOut();
          if (!cancelled) handleError('Access denied: No profile record found for this account.');
        }
      } catch (err: any) {
        console.warn('OAuth return verification warning:', err?.message);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- SIGN IN WITH SUPABASE ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      handleError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      handleError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    if (heartsync.supabase) {
      try {
        const { data, error } = await heartsync.supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) throw error;
        if (!data.session || !data.user) throw new Error('Could not establish an active session.');

        // Sync & verify profile with authoritative backend
        const syncRes = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: cleanEmail,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0]
          })
        });

        if (!syncRes.ok) {
          await heartsync.supabase.auth.signOut();
          const errBody = await syncRes.json().catch(() => ({}));
          throw new Error(errBody.error || 'Failed to verify account permissions.');
        }

        const syncData = await syncRes.json();
        const profile = syncData.profile;

        if (!profile) {
          await heartsync.supabase.auth.signOut();
          throw new Error('Access denied: No profile record found for this account.');
        }

        if (profile.is_suspended) {
          await heartsync.supabase.auth.signOut();
          throw new Error('Access denied: This administrator account has been suspended.');
        }

        if (profile.status === 'pending') {
          await heartsync.supabase.auth.signOut();
          throw new Error('Access denied: Your registration is currently pending approval.');
        }

        const isAuthorizedAdmin = ['admin', 'Super Admin', 'Admin', 'editor', 'author', 'moderator'].includes(profile.role);

        if (!isAuthorizedAdmin) {
          await heartsync.supabase.auth.signOut();
          throw new Error('Access denied: This portal is reserved for administrators only.');
        }

        const expectedRole = ['admin', 'Super Admin', 'Admin'].includes(profile.role) ? 'admin' : profile.role.toLowerCase();

        // Save session in central store memory and localStorage
        heartsync.current_user = {
          id: profile.id,
          email: profile.email || cleanEmail,
          role: expectedRole as any,
          name: profile.name || profile.full_name || cleanEmail.split('@')[0],
          avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          bio: profile.bio || '',
          created_at: profile.created_at
        };
        
        heartsync.logAction('Admin Login Session', `Email: ${cleanEmail}`);
        heartsync.saveState();
        heartsync.triggerUpdate();

        handleSuccess('Sign-in successful. Welcome to Heartsync Console!');
        setIsSubmitting(false);
        onSuccess();
      } catch (err: any) {
        console.warn('⚡ Supabase sign in error:', err.message);
        setIsSubmitting(false);
        handleError(err.message || 'Incorrect email or password.');
      }
    } else {
      setIsSubmitting(false);
      handleError('Connection failed: Supabase client is not configured.');
    }
  };

  // --- SIGN UP REGISTER WITH SUPABASE ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      handleError('Please enter your full name.');
      return;
    }
    if (!cleanUsername) {
      handleError('Please choose a username.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      handleError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      handleError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      handleError('The passwords do not match.');
      return;
    }

    if (regMode === 'invite') {
      handleError('Registration is currently locked. New administrators are by Invite Only.');
      return;
    }

    setIsSubmitting(true);

    if (heartsync.supabase) {
      try {
        const { data, error } = await heartsync.supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
              username: cleanUsername,
              role: 'Admin' // This will be captured by the DB trigger to assign the appropriate role & status
            }
          }
        });

        if (error) throw error;

        setIsSubmitting(false);

        if (regMode === 'manual') {
          handleSuccess('Registration submitted successfully! Your account is currently Pending Approval. A Super Admin will review your registration shortly before you can log in.');
        } else {
          handleSuccess('Your administrator account has been successfully created. You can now switch to the Sign In tab and log in.');
          setName('');
          setUsername('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setActiveTab('signin');
        }
      } catch (err: any) {
        console.warn('⚡ Registration error:', err.message);
        setIsSubmitting(false);
        handleError(err.message || 'An error occurred while creating your account.');
      }
    } else {
      setIsSubmitting(false);
      handleError('Connection failed: Supabase client is not configured.');
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 font-sans bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Verifying first-run database parameters...</p>
        </div>
      </div>
    );
  }

  if (isSetupWizard) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 font-sans bg-slate-50 dark:bg-zinc-950 transition-colors duration-200" id="heartsync-setup-container">
        <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
           className="w-full max-w-[500px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between"
           id="heartsync-setup-card"
        >
          <div className="flex-1">
            {/* Setup Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-zinc-800" id="heartsync-setup-header">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-rose-600 font-semibold tracking-wider text-[10px] uppercase mb-1">Heartsync Initialization</span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-sans" id="heartsync-setup-title">
                First-Run Setup Wizard
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed" id="heartsync-setup-subtitle">
                No active administrators exist in the database. Please initialize the primary administrative account to activate the security framework.
              </p>
            </div>

            {/* Warning badge */}
            <div className="mt-5 mb-5 p-3.5 bg-rose-50/40 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-950/20 rounded-xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Secure Master Account seeding</p>
                <p className="opacity-90 leading-relaxed">
                  This administrative account will be granted full access privileges automatically. Once created, this setup wizard is disabled permanently.
                </p>
              </div>
            </div>

            {/* Error and success banners */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 flex items-start gap-3 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 flex items-start gap-3 text-xs font-medium"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="leading-relaxed">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Setup Form */}
            <form onSubmit={handleSetupWizardSubmit} className="space-y-4" id="heartsync-setup-form">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Master Administrator Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Peter Tubin"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Secure Contact Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@heartsync.com"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-slate-950 text-white font-medium flex items-center justify-center gap-2 rounded-lg mt-6 shadow-md transition-all"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-rose-500" />
                    <span>Initialize Console & Seeding Master Account</span>
                  </div>
                )}
              </Button>
            </form>
            {/* Continue with Google */}
            <div className="flex items-center gap-3 mt-5">
              <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">or</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.91c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.29-4.74 3.29-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              Continue with Google
            </button>

            {/* Back Button */}
            <div className="flex items-center justify-center mt-6">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                ← Return to Client Homepage
              </button>
            </div>
          </div>

          {/* Console Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-sans">
            <span>Enterprise-grade security initialization</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 font-sans bg-slate-50 dark:bg-zinc-950 transition-colors duration-200" id="heartsync-login-container">
      <motion.div 
         initial={{ opacity: 0, y: 15 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
         className="w-full max-w-[480px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between"
         id="heartsync-admin-auth-card"
      >
        <div className="flex-1">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-zinc-800" id="heartsync-login-header">
            <span className="text-rose-600 font-semibold tracking-wider text-xs uppercase mb-1">Heartsync Console</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-sans" id="heartsync-login-title">
              {activeTab === 'register' ? 'Register Administrator' : 'Administrator Sign In'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed" id="heartsync-login-subtitle">
              {activeTab === 'register' 
                ? 'Create a secure account on the Heartsync network.' 
                : 'Sign in to access your administrative dashboard.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-zinc-950 p-1.5 rounded-lg my-6" id="heartsync-auth-tabs">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-50 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-50 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Register
            </button>
          </div>

          {/* Registration mode notice */}
          {activeTab === 'register' && !isLoadingSettings && (
            <div className={`mb-6 p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
              regMode === 'manual' 
                ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'
                : regMode === 'invite'
                ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400'
                : 'bg-rose-50/40 dark:bg-rose-950/5 border-rose-100 dark:border-rose-950/20 text-rose-700 dark:text-rose-400'
            }`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Registration Mode: {regMode.toUpperCase()}</p>
                <p className="opacity-90 leading-relaxed">
                  {regMode === 'manual'
                    ? 'All new registrations will be created with PENDING status and must be manually approved by a Super Admin before login is possible.'
                    : regMode === 'invite'
                    ? 'Registration is currently locked. Only invited users can register admin roles.'
                    : 'Open registration is active. Your account is immediately ready upon successful verification.'}
                </p>
              </div>
            </div>
          )}

          {/* Dynamic feedback banners */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 flex items-start gap-3 text-xs font-medium"
                id="heartsync-login-error"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 flex items-start gap-3 text-xs font-medium"
                id="heartsync-login-success"
              >
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4" id="heartsync-signin-form">
              <div className="space-y-3">
                <div className="space-y-1.5" id="heartsync-email-field">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@heartsync.com"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-rose-500 rounded-lg"
                      id="heartsync-signin-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5" id="heartsync-password-field">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-rose-500 rounded-lg"
                      id="heartsync-signin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-slate-950 text-white font-medium flex items-center justify-center gap-2 rounded-lg mt-6 shadow-md transition-all"
                id="heartsync-signin-submit"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

          )}

            {/* Continue with Google (sign-in tab only) */}
            {activeTab === 'signin' && (
              <>
                <div className="flex items-center gap-3 mt-5">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">or</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.91c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.29-4.74 3.29-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  Continue with Google
                </button>
              </>
            )}

          {/* Registration Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" id="heartsync-register-form">
              <div className="space-y-3">
                <div className="space-y-1.5" id="heartsync-reg-name-field">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Peter Tubin"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                      id="heartsync-register-name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5" id="heartsync-reg-user-field">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Username</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                      id="heartsync-register-username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5" id="heartsync-reg-email-field">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="peter@heartsync.com"
                      className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                      id="heartsync-register-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5" id="heartsync-reg-password-field">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                        id="heartsync-register-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5" id="heartsync-reg-confirm-field">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-10 text-sm dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-lg"
                        id="heartsync-register-confirm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting || regMode === 'invite'}
                className="w-full h-11 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center justify-center gap-2 rounded-lg mt-6 shadow-md transition-all"
                id="heartsync-register-submit"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Administrator Account</span>
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Back Button */}
          <div className="flex items-center justify-center mt-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              ← Back to Client Homepage
            </button>
          </div>
        </div>

        {/* Console Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-sans">
          <span>Enterprise-grade security</span>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => onNavigate('privacy')}
              className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => onNavigate('terms')}
              className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
