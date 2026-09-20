import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Plus, Trash2, Sparkles, Copy, BookHeart, HeartHandshake, ScrollText } from 'lucide-react';
import { heartsync } from '../store';
import { BOUNDARIES_TEMPLATES } from '../utils/data/boundariesTemplates';

const JOURNAL_PROMPTS = [
  'What did I need today that I didn\'t ask for — and what stopped me from asking?',
  'Where in my body did I feel tension this week? What was happening when it started?',
  'What is one thing I forgive myself for this month?',
  'Which relationship gave me energy this week, and which one drained me? What made the difference?',
  'What am I afraid my partner or closest person would find out about me if they looked closely?',
  'When did I last feel truly seen? Describe the moment in detail.',
  'What boundary did I almost set this week but swallowed instead? What would saying it have cost me?',
  'If I treated myself the way I treat my dearest friend, what would change tomorrow?',
  'What story am I telling myself about my last relationship — and what parts of it might not be true?',
  'What does love look like on an ordinary Tuesday, when nobody is watching?',
  'Whose approval am I still chasing, and what would it mean to stop?',
  'What did love look like in the home I grew up in, and what did it teach me to expect?'
];

type VaultTab = 'vault' | 'journal' | 'boundaries';

export default function LoveVault() {
  const [, force] = useState(0);
  const [signedIn, setSignedIn] = useState(!!heartsync.current_user);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTab>('vault');

  // vault composer
  const [vKind, setVKind] = useState('memory');
  const [vTitle, setVTitle] = useState('');
  const [vContent, setVContent] = useState('');

  // journal composer
  const [jPrompt, setJPrompt] = useState('');
  const [jContent, setJContent] = useState('');
  const [jMood, setJMood] = useState('');
  const [jInspireBusy, setJInspireBusy] = useState(false);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => force((n) => n + 1));
    if (heartsync.current_user) {
      heartsync.loadVaultData();
      setSignedIn(true);
    }
    const dayIndex = Math.floor(Date.now() / 86400000) % JOURNAL_PROMPTS.length;
    setJPrompt(JOURNAL_PROMPTS[dayIndex]);
    return unsub;
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const result = authMode === 'signup'
        ? await heartsync.registerNewUser(authName.trim() || authEmail.split('@')[0], authEmail.trim(), authPassword)
        : await heartsync.signInWithEmail(authEmail.trim(), authPassword);
      if (!result.success) {
        setAuthError(result.error || 'Sign-in failed. Please try again.');
        return;
      }
      await heartsync.loadVaultData();
      setSignedIn(true);
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication is unavailable right now.');
    } finally {
      setAuthBusy(false);
    }
  };

  const inspirePrompt = async () => {
    setJInspireBusy(true);
    try {
      const res = await fetch('/api/advice/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'inspire me', mode: 'journal_prompt' })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.answer) {
        setJPrompt(data.answer.replace(/^["']|["']$/g, ''));
      }
    } catch {
      // silently keep the current prompt
    } finally {
      setJInspireBusy(false);
    }
  };

  const copyScript = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      heartsync.notifyToast('Script copied to your clipboard.', 'success');
    } catch {
      heartsync.notifyToast('Copy failed — please select the text manually.', 'error');
    }
  };

  // ---------- Auth gate ----------
  if (!signedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-14 sm:py-20 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 mb-5">
          <Lock className="w-7 h-7 text-rose-500" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Your LoveVault is private</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Vault notes, journal entries, and boundary scripts are stored under your own account,
          visible to nobody but you. Create a free account to unlock the vault.
        </p>
        <form onSubmit={handleAuth} className="mt-7 space-y-3 text-left">
          {authMode === 'signup' && (
            <input
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
            />
          )}
          <input
            type="email"
            required
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
          />
          <input
            type="password"
            required
            minLength={6}
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
          />
          {authError && <p className="text-xs text-rose-500">{authError}</p>}
          <button
            type="submit"
            disabled={authBusy}
            className="w-full rounded-2xl bg-rose-500 text-white py-3 text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create my vault' : 'Sign in'}
          </button>
        </form>
        <button
          onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
          className="mt-4 text-xs text-zinc-500 hover:text-rose-500 underline underline-offset-4"
        >
          {authMode === 'signup' ? 'I already have an account' : 'I need to create an account'}
        </button>
      </div>
    );
  }

  const tabs: Array<{ id: VaultTab; label: string; icon: React.ReactNode }> = [
    { id: 'vault', label: 'Vault', icon: <BookHeart className="w-4 h-4" /> },
    { id: 'journal', label: 'Journal', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'boundaries', label: 'Boundaries', icon: <HeartHandshake className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 mb-4">
          <Lock className="w-7 h-7 text-rose-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">LoveVault</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          A private space: keep memories and letters, write your journal, and pull boundary
          scripts when you need the exact words.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-rose-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- VAULT ---------- */}
      {activeTab === 'vault' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Keep something</h2>
            <div className="flex gap-2 mb-3">
              {(['memory', 'milestone', 'letter'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setVKind(k)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${
                    vKind === k
                      ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              value={vTitle}
              onChange={(e) => setVTitle(e.target.value)}
              placeholder="Title (e.g. The day we first said it)"
              className="w-full mb-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
            />
            <textarea
              value={vContent}
              onChange={(e) => setVContent(e.target.value)}
              placeholder="Write it in your own words…"
              rows={4}
              className="w-full mb-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
            />
            <button
              onClick={() => {
                if (!vTitle.trim() && !vContent.trim()) return;
                heartsync.addVaultItem(vKind, vTitle.trim(), vContent.trim());
                setVTitle('');
                setVContent('');
              }}
              disabled={!vTitle.trim() && !vContent.trim()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-rose-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Save to vault
            </button>
          </div>

          {heartsync.vaultItems.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-6">Your vault is empty. First entry is yours to write.</p>
          ) : (
            <div className="space-y-3">
              {heartsync.vaultItems.map((v) => (
                <div key={v.id} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">{v.kind}</span>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white mt-0.5">{v.title}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{new Date(v.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => heartsync.deleteVaultItem(v.id)}
                      className="text-zinc-400 hover:text-rose-500"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{v.content}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ---------- JOURNAL ---------- */}
      {activeTab === 'journal' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Today's reflection</h2>
              <button
                onClick={inspirePrompt}
                disabled={jInspireBusy}
                className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {jInspireBusy ? 'Thinking…' : 'Inspire me'}
              </button>
            </div>
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-4 py-3 mb-3">
              <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">{jPrompt}</p>
            </div>
            <textarea
              value={jContent}
              onChange={(e) => setJContent(e.target.value)}
              placeholder="Write freely. Nobody reads this but you."
              rows={5}
              className="w-full mb-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {['low', 'okay', 'good', 'great'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setJMood(m)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      jMood === m
                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!jContent.trim()) return;
                  heartsync.addJournalEntry(jPrompt, jContent.trim(), jMood || null);
                  setJContent('');
                  setJMood('');
                }}
                disabled={!jContent.trim()}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-rose-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Save entry
              </button>
            </div>
          </div>

          {heartsync.journalEntries.length > 0 && (
            <div className="space-y-3">
              {heartsync.journalEntries.map((j) => (
                <div key={j.id} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {j.mood && <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Felt: {j.mood}</span>}
                      <p className="text-[11px] text-zinc-400 mt-0.5">{new Date(j.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => heartsync.deleteJournalEntry(j.id)}
                      className="text-zinc-400 hover:text-rose-500"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {j.prompt && <p className="mt-2 text-xs italic text-zinc-400">{j.prompt}</p>}
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{j.content}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ---------- BOUNDARIES ---------- */}
      {activeTab === 'boundaries' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Real scripts for real conversations. Adapt the wording to your voice — a boundary
            only works if it sounds like you.
          </p>
          {BOUNDARIES_TEMPLATES.map((b) => (
            <div key={b.id} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">{b.category}</span>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mt-0.5">{b.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{b.when}</p>
              <div className="mt-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{b.script}</p>
              </div>
              <button
                onClick={() => copyScript(b.script)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600"
              >
                <Copy className="w-3.5 h-3.5" /> Copy script
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
