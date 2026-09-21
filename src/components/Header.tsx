import React, { useState, useEffect } from 'react';
import { heartsync, getAuthors } from '../store';
import { 
  Heart, BookOpen, Bookmark, User, LogOut, Sun, Moon, ShieldAlert, 
  BookMarked, Search, X, Globe, ChevronDown, UserPlus, LogIn, Settings, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight,
  Camera, Trash, ShieldCheck, Check, CreditCard, RefreshCw, Sliders, HelpCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HamburgerButton from './HamburgerButton';
import MobileMenu from './MobileMenu';
import NavigationLinks from './NavigationLinks';
import { Language, getTranslation, saveLanguage, getEnabledLanguages } from '../utils/i18n';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, arg?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export default function Header({ 
  currentTab, 
  onNavigate, 
  searchQuery, 
  setSearchQuery, 
  theme, 
  setTheme,
  lang,
  setLang
}: HeaderProps) {
  const [user, setUser] = useState(heartsync.current_user);
  const [bookmarks, setBookmarks] = useState(heartsync.bookmarks);
  const [siteSettings, setSiteSettings] = useState(heartsync.site_settings);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Authentication Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // New Upgraded Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeProfileSection, setActiveProfileSection] = useState<'profile' | 'membership' | 'preferences' | 'danger'>('profile');

  // Settings local toggles for Phase 2 settings page optimization
  const [notifyResearch, setNotifyResearch] = useState(true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(true);
  const [notifySomatic, setNotifySomatic] = useState(true);
  const [anonymousReading, setAnonymousReading] = useState(false);
  const [strictSessionEncryption, setStrictSessionEncryption] = useState(true);
  const [storagePurged, setStoragePurged] = useState(false);

  // Image Compressor (Phase 1 / Phase 4) - keeps uploaded images small and fast
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 180; // Resize to max 180x180
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            resolve(compressedBase64);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('Please upload an image file.');
        return;
      }
      try {
        const compressed = await compressImage(file);
        setProfileAvatar(compressed);
        setProfileSuccess('Image uploaded and compressed successfully!');
        setTimeout(() => setProfileSuccess(null), 1500);
      } catch (err: any) {
        setProfileError('Failed to process image: ' + err.message);
      }
    }
  };

  // Synchronize profile modal inputs with current user
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileBio(user.bio || '');
      setProfileAvatar(user.avatar_url || '');
    } else {
      setProfileName('');
      setProfileBio('');
      setProfileAvatar('');
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);

    try {
      if (authModalMode === 'reset') {
        if (password.length < 6) {
          setAuthError('Your new password must be at least 6 characters long.');
          setAuthSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setAuthError('The passwords you entered do not match.');
          setAuthSubmitting(false);
          return;
        }
        const res = await heartsync.updateUserPassword(password);
        if (res.success) {
          setAuthSuccess('Your password has been updated. You are signed in.');
          setTimeout(() => {
            setAuthModalOpen(false);
            setAuthModalMode('login');
            setPassword('');
            setConfirmPassword('');
          }, 1800);
        } else {
          setAuthError(res.error || 'Could not update your password. Please try again.');
        }
        setAuthSubmitting(false);
        return;
      }

      if (authModalMode === 'forgot') {
        const res = await heartsync.requestPasswordReset(email);
        if (res.success) {
          setAuthSuccess('If an account exists for that email, a reset link is on its way. Please check your inbox.');
        } else {
          setAuthError(res.error || 'Could not send the reset email. Please try again.');
        }
        setAuthSubmitting(false);
        return;
      }

      if (authModalMode === 'signup') {
        if (!name.trim()) {
          setAuthError('Please enter your full name.');
          setAuthSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setAuthError('The passwords you entered do not match.');
          setAuthSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('Your password must be at least 6 characters long.');
          setAuthSubmitting(false);
          return;
        }

        const res = await heartsync.registerNewUser(name, email, password);
        if (res.success) {
          if (res.needsEmailConfirmation) {
            // Supabase requires email confirmation before the session is issued
            setAuthSuccess('Account created. Please check your inbox for a confirmation email to finish signing up.');
            setTimeout(() => {
              setAuthModalMode('login');
              setPassword('');
              setConfirmPassword('');
            }, 2500);
          } else {
            setAuthSuccess('Your account has been created successfully. Welcome to HEARTSYNC.');
            setTimeout(() => {
              setAuthModalOpen(false);
              // Reset fields
              setName('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }, 1500);
          }
        } else {
          setAuthError(res.error || 'Failed to create your account. Please try again.');
        }
      } else {
        const res = await heartsync.loginCustomUser(email, password);
        if (res.success) {
          setAuthSuccess('Signed in successfully.');
          setTimeout(() => {
            setAuthModalOpen(false);
            setEmail('');
            setPassword('');
          }, 1500);
        } else {
          setAuthError(res.error || 'Incorrect email or password. Please try again.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    if (!heartsync.supabase) {
      setAuthError('Supabase is not initialized.');
      return;
    }
    try {
      const { error } = await heartsync.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err: any) {
      setAuthError(err.message || 'OAuth initiation failed.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSubmitting(true);

    if (!user) {
      setProfileError('No active session.');
      setProfileSubmitting(false);
      return;
    }

    try {
      if (heartsync.supabase) {
        const { error } = await heartsync.supabase
          .from('profiles')
          .update({
            full_name: profileName.trim(),
            bio: profileBio.trim(),
            avatar_url: profileAvatar.trim()
          })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        // Dynamically update heartsync local user state
        heartsync.current_user = {
          ...user,
          name: profileName.trim(),
          bio: profileBio.trim(),
          avatar_url: profileAvatar.trim()
        };
        heartsync.saveState();
        heartsync.triggerUpdate();

        setProfileSuccess('Profile updated successfully!');
        setIsEditingProfile(false);
        setTimeout(() => {
          setProfileModalOpen(false);
        }, 1200);
      } else {
        setProfileError('Supabase database client not connected.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Could not update profile database entry.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  useEffect(() => {
    // Subscribe to global store changes
    const unsubscribe = heartsync.subscribe(() => {
      setUser(heartsync.current_user);
      setBookmarks([...heartsync.bookmarks]);
      setSiteSettings({ ...heartsync.site_settings });
    });

    setSiteSettings({ ...heartsync.site_settings });

    // Password-reset recovery link: Supabase returns the user to the site with
    // a recovery session and a hash like #type=recovery  - open the new-password form.
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setAuthModalMode('reset');
      setAuthModalOpen(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSearch.trim()) {
      setSearchQuery(tempSearch);
      onNavigate('search');
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    heartsync.logoutUser();
  };

  const bookmarkedPosts = heartsync.posts.filter(p => bookmarks.includes(p.id));

  const headerSettings = siteSettings.header_settings;
  const headerPositionClass = headerSettings?.sticky === false ? "relative z-50 w-full transition-colors duration-300" : "sticky top-0 z-50 w-full transition-colors duration-300";

  let headerBgStyle: React.CSSProperties = {};
  let textStyle: React.CSSProperties = {};
  
  if (headerSettings) {
    if (headerSettings.bg_color) {
      if (headerSettings.transparency === 'blur') {
        const hex = headerSettings.bg_color;
        let r = 255, g = 255, b = 255;
        if (hex.startsWith('#') && hex.length === 7) {
          r = parseInt(hex.slice(1, 3), 16);
          g = parseInt(hex.slice(3, 5), 16);
          b = parseInt(hex.slice(5, 7), 16);
        }
        headerBgStyle = { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.85)`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };
      } else if (headerSettings.transparency === 'transparent') {
        headerBgStyle = { backgroundColor: 'transparent', borderBottomColor: 'transparent' };
      } else {
        headerBgStyle = { backgroundColor: headerSettings.bg_color };
      }
    }
    if (headerSettings.text_color) {
      textStyle = { color: headerSettings.text_color };
    }
  }

  const logoSrc = headerSettings?.logo_url || siteSettings.logo_url;
  const siteName = headerSettings?.site_name || siteSettings.site_name || 'Heartsync';
  const tagline = headerSettings?.tagline || 'wellness blog';

  // Elite design studio header configuration presets
  const headerStyleSetting = siteSettings.header_style || heartsync.getLocalStorage('pn_brand_header_style', 'blur');

  let headerStyleClass = "";
  if (headerStyleSetting === 'blur') {
    headerStyleClass = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-rose-100/50 dark:border-zinc-800/80 neon-edge-static";
  } else if (headerStyleSetting === 'solid') {
    headerStyleClass = "bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-850 neon-edge-static";
  } else if (headerStyleSetting === 'transparent') {
    headerStyleClass = "bg-transparent border-transparent";
  } else if (headerStyleSetting === 'banner') {
    headerStyleClass = "bg-gradient-to-r from-rose-50 to-rose-100/40 dark:from-zinc-950 dark:to-zinc-900 border-b border-rose-200/40 dark:border-zinc-800/80 neon-edge-static";
  }

  const layoutWidthSetting = siteSettings.layout_width || heartsync.getLocalStorage('pn_brand_layout_width', 'contained');
  const headerContainerClass = layoutWidthSetting === 'wide' 
    ? 'w-full flex items-center justify-between gap-2.5' 
    : 'max-w-[1536px] mx-auto flex items-center justify-between gap-2.5';

  return (
    <header className={headerPositionClass}>

      <div 
        className={`px-4 py-3 sm:px-6 lg:px-8 transition-all ${headerStyleClass}`}
        style={headerBgStyle}
      >
        <div className={headerContainerClass}>
          
          {/* Left: Hamburger button AND desktop links overlay */}
          <div className="flex items-center justify-start gap-4">
            <HamburgerButton 
              isOpen={mobileMenuOpen} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            />
            {/* Navigation Links for desktop, subtle and professional */}
            <nav className="hidden lg:flex items-center gap-4">
              <NavigationLinks 
                currentTab={currentTab} 
                onNavigate={onNavigate} 
                lang={lang} 
                menuItems={headerSettings?.menu_items} 
                textColor={headerSettings?.text_color}
              />
            </nav>
          </div>
          
          {/* Center: HeartSync Clean Styled Logo Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center justify-center gap-1.5 cursor-pointer group shrink-0"
          >
            {logoSrc ? (
              <img 
                src={logoSrc} 
                alt={siteName} 
                className="w-8 h-8 rounded-full object-cover shadow-xs group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#CE2B5E] shadow-xs group-hover:scale-105 transition-transform shrink-0 dark:shadow-[0_0_16px_rgba(244,63,94,0.45)]">
                <Heart className="w-4.5 h-4.5 fill-current" />
              </div>
            )}
            <div className="flex items-baseline">
              <span className="font-serif font-black text-lg tracking-tight text-zinc-900 dark:text-white">
                Heart
              </span>
              <span className="font-sans font-bold text-lg tracking-tight text-[#CE2B5E]">
                Sync
              </span>
            </div>
          </div>

          {/* Right: Action Icons Panel (Search, language switcher etc.) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
            
            {/* Search Toggle */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-zinc-50 dark:bg-zinc-805 border border-zinc-200 dark:border-zinc-700 dark:border-rose-500/25 dark:shadow-[0_0_12px_rgba(244,63,94,0.15)] rounded-full px-2.5 py-0.5 w-48 shadow-sm transition-all duration-300">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    autoFocus
                    className="w-full text-[10px] font-sans outline-none bg-transparent text-zinc-800 dark:text-zinc-100"
                  />
                  <button type="submit" className="text-zinc-400 hover:text-rose-500">
                    <Search className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setSearchOpen(false)} className="text-zinc-400 pl-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-full text-zinc-650 dark:text-zinc-400 hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 hover:text-[#CE2B5E] transition-colors"
                  title="Search Content"
                >
                  <Search className="w-5 h-5 font-black" />
                </button>
              )}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full text-zinc-605 dark:text-zinc-405 hover:bg-rose-50/50 dark:hover:bg-zinc-850/50 hover:text-[#CE2B5E] transition-colors"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Bookmark Trigger */}
            <Button 
              id="bookmark-drawer-trigger"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowBookmarksDrawer(true)}
              className="rounded-full text-zinc-605 dark:text-zinc-450 hover:bg-rose-50/50 dark:hover:bg-zinc-850/50 hover:text-[#CE2B5E] transition-colors relative mr-1"
              title="My Bookmarks & Offline Reading"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarks.length > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {bookmarks.length}
                </span>
              )}
            </Button>

            {/* Profile Dropdown or Login / Sign Up Dynamic Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1 p-0.5 rounded-full hover:bg-rose-50/50 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer select-none"
                  title="My Account"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-rose-100 dark:border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-zinc-800 text-[#CE2B5E] dark:text-zinc-300 flex items-center justify-center border border-rose-100 dark:border-zinc-700 font-bold text-xs uppercase shadow-xs">
                      {user.name ? user.name.slice(0, 2) : 'US'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      {/* Close overlay */}
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileDropdownOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-[340px] md:w-[380px] bg-[#f8fafd] border border-zinc-200/80 rounded-[28px] shadow-2xl z-50 overflow-hidden font-sans text-zinc-800"
                      >
                        {/* Google style header row with email and close button */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100">
                          <span className="text-sm font-medium text-zinc-500 truncate max-w-[240px]">{user.email}</span>
                          <button 
                            onClick={() => setProfileDropdownOpen(false)} 
                            className="rounded-full p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                            title="Close"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Centered Active Account block */}
                        <div className="flex flex-col items-center text-center px-6 pt-6 pb-6 bg-white">
                          <div className="relative group cursor-pointer mb-4">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name || 'User'}
                                className="w-[84px] h-[84px] rounded-full object-cover border border-zinc-200/80 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-tr from-[#CE2B5E] to-rose-400 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-xs">
                                {user.name ? user.name.slice(0, 2) : 'US'}
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                setProfileModalOpen(true);
                                setProfileDropdownOpen(false);
                              }}
                              className="absolute bottom-0 right-0 p-2 bg-white border border-zinc-200 text-zinc-600 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Change profile picture"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>

                          <h4 className="font-sans font-medium text-lg text-zinc-900 leading-tight">
                            Hi, {user.name ? user.name.split(' ')[0] : 'Reader'}!
                          </h4>
                          <p className="text-sm text-zinc-500 mt-1">
                            {user.name || 'Heartsync Reader'}
                          </p>

                          <button
                            onClick={() => {
                              setProfileModalOpen(true);
                              setProfileDropdownOpen(false);
                            }}
                            className="mt-4 px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-full text-sm font-semibold text-zinc-700 shadow-3xs hover:shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <User className="w-4 h-4 text-zinc-500" />
                            <span>Manage your Heartsync Account</span>
                          </button>
                        </div>

                        {/* Outer Card block with list of premium features */}
                        <div className="px-5 py-4 bg-[#f8fafd]">
                          <div className="rounded-[24px] bg-white border border-zinc-150 p-2 space-y-1 shadow-3xs">
                            <button
                              onClick={() => {
                                onNavigate('subscription');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Heart className="w-5 h-5 text-amber-500 fill-amber-500/15" />
                                <span>Premium Membership</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {user.subscription_status === 'active' ? (
                                  <span className="text-xs text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-md font-bold">Active</span>
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                setShowBookmarksDrawer(true);
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Bookmark className="w-5 h-5 text-rose-500 fill-rose-500/5" />
                                <span>Saved Posts</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {bookmarks.length > 0 && (
                                  <span className="text-xs bg-rose-50 text-[#CE2B5E] px-2 py-0.5 rounded-full font-bold">{bookmarks.length}</span>
                                )}
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                setSettingsModalOpen(true);
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-zinc-500" />
                                <span>Settings</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </button>

                            {user && (user.role === 'admin' || user.role === 'author') && (
                              <button
                                onClick={() => {
                                  onNavigate('admin');
                                  setProfileDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                                  <span>Admin Console</span>
                                </div>
                                <span className="text-xs uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold">{user.role}</span>
                              </button>
                            )}
                          </div>

                          {/* Bottom Footer Section: Sign Out Button & Privacy Links */}
                          <div className="mt-5 pt-1 pb-1 flex flex-col items-center gap-4">
                            <button
                              onClick={() => {
                                handleLogout();
                                setProfileDropdownOpen(false);
                              }}
                              className="px-8 py-3 bg-white border border-zinc-250 hover:bg-zinc-50 rounded-full text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-all shadow-3xs hover:shadow-2xs inline-flex items-center gap-2 cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-zinc-500" />
                              <span>Sign out of Heartsync</span>
                            </button>

                            <div className="text-xs text-zinc-500 flex items-center justify-center gap-3 font-medium">
                              <span className="hover:underline cursor-pointer">Privacy Policy</span>
                              <span>•</span>
                              <span className="hover:underline cursor-pointer">Terms of Service</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="h-8 rounded-full px-4 text-[11px] font-sans font-extrabold bg-[#CE2B5E] hover:bg-[#b0224d] dark:bg-[#CE2B5E] dark:hover:bg-[#b0224d] text-white border border-transparent shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </Button>
            )}

          </div>
        </div>
      </div>

      {/* Bookmarks Drawer Overlay */}
      <AnimatePresence>
        {showBookmarksDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowBookmarksDrawer(false)} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-full dark:border-l dark:border-rose-500/20 dark:shadow-[-10px_0_30px_rgba(244,63,94,0.12)]"
              >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-rose-50/20 dark:bg-zinc-950/20">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <BookMarked className="w-5 h-5" />
                    <h3 className="font-sans font-bold text-lg">My Heart Archives</h3>
                  </div>
                  <button 
                    onClick={() => setShowBookmarksDrawer(false)}
                    className="p-1 rounded-full hover:bg-rose-100/50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {bookmarkedPosts.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Bookmark className="w-12 h-12 text-rose-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm font-sans font-medium text-zinc-600 dark:text-zinc-400">Your archive is empty.</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                        Click the bookmark star on relationship articles to save them here for offline wellness guides.
                      </p>
                    </div>
                  ) : (
                    bookmarkedPosts.map(post => (
                      <div 
                        key={post.id} 
                        onClick={() => {
                          onNavigate('article', post.slug);
                          setShowBookmarksDrawer(false);
                        }}
                        className="p-3.5 rounded-xl border border-rose-100/30 hover:border-rose-300/40 dark:border-zinc-800 dark:hover:border-zinc-700 bg-rose-50/5 dark:bg-zinc-800/40 hover:bg-rose-50/30 dark:hover:bg-zinc-800/80 cursor-pointer transition-all flex gap-3 group"
                      >
                        <img 
                          src={post.featured_image} 
                          alt={post.title} 
                          className="w-16 h-16 rounded-lg object-cover shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold font-sans text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {post.read_time} min read
                            </span>
                            <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Offline Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                  <button 
                    onClick={() => {
                      onNavigate('articles');
                      setShowBookmarksDrawer(false);
                    }}
                    className="w-full text-center py-2.5 bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white font-sans text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Browse More Articles
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Authentication Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAuthModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default"
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-2xl border border-zinc-100 dark:border-zinc-800 transition-all z-50"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Brand Header */}
                <div className="text-center mt-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-zinc-800 text-[#CE2B5E] flex items-center justify-center mx-auto shadow-sm mb-3">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="font-serif font-black text-2xl text-zinc-900 dark:text-white leading-snug">
                    {authModalMode === 'login' ? 'Welcome back' : authModalMode === 'signup' ? 'Join HEARTSYNC' : authModalMode === 'forgot' ? 'Reset your password' : 'Choose a new password'}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                    {authModalMode === 'login' 
                      ? 'Sign in to access your saved guides, attachment charts, and personalized content.' 
                      : authModalMode === 'signup'
                      ? 'Create an account to save guides, trace relationship scores, and connect with your partner.'
                      : authModalMode === 'forgot'
                      ? 'Enter your email and we will send you a link to choose a new password.'
                      : 'Pick a new password for your HEARTSYNC account.'}
                  </p>
                </div>

                {/* Form Switch tabs */}
                <div className="flex bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-sans font-bold rounded-lg transition-all ${
                      authModalMode === 'login'
                        ? 'bg-white dark:bg-zinc-800 text-[#CE2B5E] shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-sans font-bold rounded-lg transition-all ${
                      authModalMode === 'signup'
                        ? 'bg-white dark:bg-zinc-800 text-[#CE2B5E] shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    Create account
                  </button>
                </div>

                {/* Status Banners */}
                <AnimatePresence mode="wait">
                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-sans leading-relaxed">{authError}</span>
                    </motion.div>
                  )}
                  {authSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-sans leading-relaxed">{authSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Auth Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans font-medium">
                  {authModalMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Full name</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Evelyn Stone"
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#CE2B5E] dark:focus:border-[#CE2B5E] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Email address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="evelyn@heartsync.com"
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#CE2B5E] dark:focus:border-[#CE2B5E] transition-all"
                      />
                    </div>
                  </div>

                  {authModalMode !== 'forgot' && (
<div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#CE2B5E] dark:focus:border-[#CE2B5E] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  )}

                  {(authModalMode === 'signup' || authModalMode === 'reset') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Confirm password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#CE2B5E] dark:focus:border-[#CE2B5E] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {authModalMode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('forgot');
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-[10px] font-bold text-zinc-400 hover:text-[#CE2B5E] dark:text-zinc-500 dark:hover:text-[#CE2B5E] transition-colors cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  {authModalMode === 'forgot' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('login');
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-[10px] font-bold text-zinc-400 hover:text-[#CE2B5E] dark:text-zinc-500 dark:hover:text-[#CE2B5E] transition-colors cursor-pointer"
                      >
                        Back to sign in
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 disabled:opacity-50 text-white font-sans text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    {authSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : authModalMode === 'login' ? (
                      <>
                        <span>Sign in</span>
                        <LogIn className="w-3.5 h-3.5" />
                      </>
                    ) : authModalMode === 'forgot' ? (
                      <>
                        <span>Send reset link</span>
                        <Mail className="w-3.5 h-3.5" />
                      </>
                    ) : authModalMode === 'reset' ? (
                      <>
                        <span>Save new password</span>
                        <Lock className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Create account</span>
                        <UserPlus className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Separator */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-150 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                    <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 0 12 0 7.37 0 3.4 2.65 1.48 6.51l3.85 2.99C6.27 6.7 8.93 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.46c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.72-4.87 3.72-8.48z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.33 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.48 6.91C.53 8.81 0 10.97 0 13s.53 4.19 1.48 6.09l3.85-2.59z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.07 0-5.73-1.66-6.67-4.46l-3.85 2.99C3.4 21.35 7.37 24 12 24z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Profile Settings Modal - Redesigned to Google Account standard UI */}
      <AnimatePresence>
        {profileModalOpen && user && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              {/* Backdrop with soft dim */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-xs cursor-default"
              />

              {/* Google Account Modal Container */}
              <motion.div 
                initial={{ scale: 0.98, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.98, y: 8, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all z-50 font-sans"
              >
                {/* Header branding block */}
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-600 fill-blue-600" />
                    <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Heartsync Account</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-header Hero Profile Display */}
                <div className="text-center mb-6">
                  {/* Google style circular avatar upload */}
                  <div className="relative inline-block group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm relative bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                      {profileAvatar ? (
                        <img
                          src={profileAvatar}
                          alt="Profile avatar"
                          className="w-full h-full object-cover transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-sans font-medium text-3xl uppercase">
                          {profileName ? profileName.slice(0, 1) : 'U'}
                        </div>
                      )}
                    </div>
                    
                    {/* Pencil camera overlay icon */}
                    <label 
                      htmlFor="avatar-upload-file-input"
                      className="absolute bottom-0 right-1 p-2 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center"
                      title="Upload photo"
                    >
                      <Camera className="w-4 h-4 text-blue-600" />
                    </label>
                    
                    <input 
                      id="avatar-upload-file-input"
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden" 
                    />
                  </div>

                  <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-3">
                    Welcome, {profileName || 'Member'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                    Manage your personal details, language options, payment subscriptions, and account security.
                  </p>
                </div>

                {/* Horizontal Section Navigation Tabs in Google Style */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto scrollbar-none gap-4">
                  {[
                    { id: 'profile', label: 'Personal info', icon: User },
                    { id: 'preferences', label: 'Data & privacy', icon: Sliders },
                    { id: 'danger', label: 'Security', icon: ShieldAlert },
                    { id: 'membership', label: 'Payments & subscriptions', icon: CreditCard },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveProfileSection(tab.id as any)}
                        className={`flex items-center gap-1.5 pb-3 px-1 text-sm font-medium transition-all border-b-2 shrink-0 min-h-[40px] cursor-pointer ${
                          activeProfileSection === tab.id
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Notifications */}
                <AnimatePresence mode="wait">
                  {profileError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{profileError}</span>
                    </motion.div>
                  )}
                  {profileSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 flex items-start gap-2.5 text-xs text-green-700 dark:text-green-400"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{profileSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submitting Spinner */}
                {profileSubmitting && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs flex items-center justify-center z-40 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="text-xs font-medium text-zinc-650 dark:text-zinc-300">Saving changes...</span>
                    </div>
                  </div>
                )}

                {/* Form Wrapper */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {activeProfileSection === 'profile' && (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div>
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Basic info</h3>
                        <p className="text-xs text-zinc-500">Some info may be visible to other members using the Heartsync dashboard.</p>
                      </div>

                      {/* Google Styled Grid rows */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                        {/* PHOTO Preset options row */}
                        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-zinc-500 block uppercase tracking-wider">Profile Photo Presets</span>
                            <span className="text-xs text-zinc-400">Choose from quick preset portraits for your account card.</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {[
                              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
                            ].map((presetUrl) => (
                              <button
                                key={presetUrl}
                                type="button"
                                onClick={() => setProfileAvatar(presetUrl)}
                                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                                  profileAvatar === presetUrl ? 'border-blue-600 scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={presetUrl} className="w-full h-full object-cover" alt="Preset portrait" />
                              </button>
                            ))}
                            {profileAvatar && (
                              <button
                                type="button"
                                onClick={() => setProfileAvatar('')}
                                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-red-500 transition-colors"
                                title="Remove photo"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* EMAIL row */}
                        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="w-full sm:w-1/3">
                            <span className="text-xs font-semibold text-zinc-500 block uppercase tracking-wider">Email address</span>
                          </div>
                          <div className="w-full sm:w-2/3 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-mono select-all truncate">{user.email}</span>
                          </div>
                        </div>

                        {/* NAME row */}
                        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="w-full sm:w-1/3">
                            <span className="text-xs font-semibold text-zinc-500 block uppercase tracking-wider">Display name</span>
                          </div>
                          <div className="w-full sm:w-2/3">
                            {isEditingProfile ? (
                              <input
                                type="text"
                                required
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="My display name"
                                className="w-full px-3.5 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-850 dark:text-zinc-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/15 transition-all min-h-[36px]"
                              />
                            ) : (
                              <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                                {profileName || 'Not configured'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* BIO/ABOUT row */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="w-full sm:w-1/3">
                            <span className="text-xs font-semibold text-zinc-500 block uppercase tracking-wider">About/Biography</span>
                          </div>
                          <div className="w-full sm:w-2/3 space-y-1.5">
                            {isEditingProfile ? (
                              <>
                                <textarea
                                  value={profileBio}
                                  onChange={(e) => setProfileBio(e.target.value.slice(0, 300))}
                                  rows={3}
                                  placeholder="Write a brief bio about your wellness journey..."
                                  maxLength={300}
                                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-850 dark:text-zinc-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/15 transition-all resize-none min-h-[70px]"
                                />
                                <div className="text-[10px] text-zinc-400 text-right font-mono">
                                  {profileBio.length} / 300
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed italic">
                                "{profileBio || 'No biography written yet.'}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Editing Actions Panel */}
                      <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                            {isEditingProfile ? 'You are currently editing your profile fields.' : 'Need to modify your registered profile info?'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(!isEditingProfile)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer shrink-0 min-h-[32px]"
                        >
                          {isEditingProfile ? 'Cancel Editing' : 'Edit profile info'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PREFERENCES / DATA & PRIVACY TAB */}
                  {activeProfileSection === 'preferences' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Data & privacy</h3>
                        <p className="text-xs text-zinc-500">Manage system display preferences.</p>
                      </div>

                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">

                        {/* Display Theme Card */}
                        <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Appearance theme</span>
                            <p className="text-xs text-zinc-500 mt-0.5">Choose between standard light and eye-safe deep dark modes.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="px-4 py-1.5 bg-white dark:bg-zinc-900 rounded-full font-semibold text-blue-600 dark:text-blue-400 border border-zinc-300 dark:border-zinc-700 shadow-3xs flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-h-[34px]"
                          >
                            {theme === 'dark' ? (
                              <>
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>Light mode</span>
                              </>
                            ) : (
                              <>
                                <Moon className="w-4 h-4 text-indigo-500" />
                                <span>Dark mode</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECURITY / DANGER TAB */}
                  {activeProfileSection === 'danger' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Security & maintenance</h3>
                        <p className="text-xs text-zinc-500">Monitor account diagnostics, clear persistent cache data, and audit safety.</p>
                      </div>

                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
                        {/* Account Token Row */}
                        <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-zinc-50/20 dark:bg-zinc-900/10">
                          <div>
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Masked security key</span>
                            <p className="text-xs text-zinc-500 mt-0.5">Secure hash representing your local companion record identifier.</p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-zinc-650 dark:text-zinc-350 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-750">
                            #HS-{user.id ? user.id.slice(0, 8).toUpperCase() : 'MEMBER'}••••
                          </span>
                        </div>

                        {/* Diagnostics & Cache cleaner */}
                        <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="max-w-md">
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Clear local cache</span>
                            <p className="text-xs text-zinc-500 mt-0.5">Flush search indexes and storage buffers to restore direct synchronization with your backup node.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                localStorage.clear();
                                sessionStorage.clear();
                                setProfileSuccess('Caches flushed successfully. Interface reloading...');
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1200);
                              } catch (err) {
                                setProfileError('Failed to reset local caches.');
                              }
                            }}
                            className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-full font-semibold text-zinc-700 dark:text-zinc-300 transition-colors shrink-0 min-h-[34px] text-xs"
                          >
                            Clear cache & Reset
                          </button>
                        </div>

                        {/* Danger zone row */}
                        <div className="p-4 bg-red-50/10 dark:bg-red-950/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="max-w-md">
                            <span className="font-semibold text-sm text-red-600 dark:text-red-400 block">Deactivate account</span>
                            <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your profile data, bookmarks, and activity logs. This cannot be undone.</p>
                          </div>
                          <button
                            type="button"
                            disabled
                            className="px-4 py-1.5 bg-red-600/10 text-red-600/40 rounded-full text-xs font-semibold border border-red-200/20 cursor-not-allowed shrink-0"
                          >
                            Deactivate Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MEMBERSHIP STATUS / PAYMENTS & SUBSCRIPTIONS TAB */}
                  {activeProfileSection === 'membership' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Payments & subscriptions</h3>
                        <p className="text-xs text-zinc-500">Monitor active subscription plan tiers and premium services.</p>
                      </div>

                      {/* Google Styled Subscription status card */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                        {/* Status Header */}
                        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Account level</span>
                            <h4 className="font-semibold text-lg text-zinc-900 dark:text-white mt-0.5">
                              {user.role === 'admin' ? 'Verified Administrator' : user.subscription_status === 'active' ? 'Heartsync Premium Plan' : 'Free Basic Member'}
                            </h4>
                          </div>
                          <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-350 border border-blue-200 dark:border-blue-800 shadow-3xs">
                            {user.subscription_status === 'active' ? 'Active subscription' : 'Standard Access'}
                          </span>
                        </div>

                        {/* Feature coverage info */}
                        <div className="p-5 space-y-4">
                          <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">Included premium access features:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-550 dark:text-zinc-400">
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                              <span>Expert Somatic Guides</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                              <span>Custom Relationship Planners</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                              <span>Direct Bookmark Archives</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                              <span>Secure Companion Synchronization</span>
                            </span>
                          </div>

                          {/* Upgrade notice if free member */}
                          {user.subscription_status !== 'active' && user.role !== 'admin' && (
                            <div className="mt-4 p-4 rounded-xl bg-blue-50/30 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-zinc-850 dark:text-zinc-200">Get unlimited workbook syncing</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Unlock custom guides, quizzes, and private diagnostic journals with Google One security.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigate('subscription');
                                  setProfileModalOpen(false);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full shadow-3xs transition-colors shrink-0 min-h-[34px] cursor-pointer"
                              >
                                View Pricing Plans
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action row in Google style */}
                  <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-6 justify-end">
                    <button
                      type="button"
                      onClick={() => setProfileModalOpen(false)}
                      className="px-5 py-2 hover:bg-zinc-150/50 dark:hover:bg-zinc-800 rounded-full text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-colors cursor-pointer min-h-[40px] border border-zinc-300 dark:border-zinc-700"
                    >
                      Close Account Manager
                    </button>
                    {isEditingProfile && activeProfileSection === 'profile' && (
                      <button
                        type="submit"
                        disabled={profileSubmitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-sm transition-all text-sm cursor-pointer min-h-[40px]"
                      >
                        Save Personal Info
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Settings Modal - Redesigned to Google standard UI */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              {/* Backdrop with soft dim */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-xs cursor-default"
              />

              {/* Google Settings Modal Container */}
              <motion.div 
                initial={{ scale: 0.98, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.98, y: 8, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all z-50 font-sans"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Settings Header */}
                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Settings className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
                      Heartsync Settings
                    </h3>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">
                      Choose settings that make Heartsync work best for you on this device.
                    </p>
                  </div>
                </div>

                {/* Content Sections styled as Google Cards */}
                <div className="space-y-5 font-sans text-xs overflow-y-auto max-h-[60vh] pr-1.5 scrollbar-thin">
                  
                  {/* CARD 1: Appearance & Localization */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Display & language</span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
                      
                      {/* Theme selection row */}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">System theme</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Switch between standard light and soothing dark mode.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="px-4 py-1.5 bg-white dark:bg-zinc-900 rounded-full font-semibold text-blue-600 dark:text-blue-400 border border-zinc-300 dark:border-zinc-700 shadow-3xs flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-h-[34px]"
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="w-3.5 h-3.5 text-amber-500" />
                              <span>Light</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Dark</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* CARD 2: Alerts & Notifications */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Alerts & notification preferences</span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
                      
                      {/* Somatic Alerts Toggle */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Somatic Content Alerts</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Get notified immediately when new attachment guides or somatic exercises are published.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyResearch(!notifyResearch)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifyResearch ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                          aria-label="Toggle somatic updates"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              notifyResearch ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Weekly Insights Toggle */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Weekly Somatic Digest</span>
                          <p className="text-xs text-zinc-500 mt-0.5">A weekly review of your progress tracker logs, wellness guides, and saved somatic items.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyNewsletter(!notifyNewsletter)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifyNewsletter ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                          aria-label="Toggle weekly digest"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              notifyNewsletter ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Co-regulation Reminders Toggle */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Active Co-regulation reminders</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Enable brief device-level alerts prompting deep breath somatic pacing during wellness tracks.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifySomatic(!notifySomatic)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifySomatic ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                          aria-label="Toggle somatic reminders"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              notifySomatic ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                    </div>
                  </div>

                             {/* CARD 3: Reading Safety & Privacy */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Privacy & security</span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
                      
                      {/* Reading History Mode */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Private browsing history</span>
                          <p className="text-xs text-zinc-500 mt-0.5">When active, your article reading history and bookmarks are saved only to your local browser.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnonymousReading(!anonymousReading)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            anonymousReading ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                          aria-label="Toggle private reading"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              anonymousReading ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Connection Cryptography headers */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 block">Secure connections (HTTPS)</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Enforce high-grade end-to-end encryption for all communications and account details.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStrictSessionEncryption(!strictSessionEncryption)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            strictSessionEncryption ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                          aria-label="Toggle TLS strict encryption"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              strictSessionEncryption ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Footer Action row in Google style */}
                <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => setSettingsModalOpen(false)}
                    className="px-5 py-2 hover:bg-zinc-150/50 dark:hover:bg-zinc-800 rounded-full text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer min-h-[38px] border border-zinc-300 dark:border-zinc-700"
                  >
                    Close Settings
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

       {/* Render Sliding Mobile Navigation Module */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentTab={currentTab}
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        setTheme={setTheme}
        onOpenBookmarks={() => setShowBookmarksDrawer(true)}
        lang={lang}
        setLang={setLang}
      />
    </header>
  );
}
