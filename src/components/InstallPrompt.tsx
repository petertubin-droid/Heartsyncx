import { useEffect, useState, useRef } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'heartsync_install_prompt_dismissed_at';
const RECHECK_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // re-invite after 30 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < RECHECK_AFTER_MS;
  } catch {
    return false;
  }
}

/**
 * PWA install invitation. Browsers fire `beforeinstallprompt` only when the
 * app meets installability criteria (manifest + icons + SW). We capture the
 * event and surface ONE tasteful, dismissible card - never a nagging modal.
 * Hidden entirely on admin routes and after dismissal for 30 days.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      deferredRef.current = evt;
      setDeferred(evt);
      if (!wasRecentlyDismissed()) setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      deferredRef.current = null;
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
  };

  const install = async () => {
    const evt = deferredRef.current || deferred;
    if (!evt || installing) return;
    setInstalling(true);
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } catch {
      // Ignore prompt errors; the card stays harmless if the browser refuses.
    } finally {
      setInstalling(false);
      setDeferred(null);
      deferredRef.current = null;
    }
  };

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Heartsync app"
      className="fixed bottom-4 right-4 z-50 max-w-xs w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/40">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
        <button
          onClick={dismiss}
          aria-label="Dismiss install invitation"
          className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-5 pr-10">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Take Heartsync with you
            </span>
          </div>
          <p className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
            Install the app
          </p>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug font-sans">
            Full-screen reading, offline articles and faster loads - straight from your home screen.
          </p>
          <button
            onClick={install}
            disabled={installing}
            className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-all shadow-lg shadow-rose-600/25 hover:shadow-rose-600/35 active:scale-[0.98] font-sans"
          >
            <Download className="w-4 h-4" />
            {installing ? 'Opening installer…' : 'Install app'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
