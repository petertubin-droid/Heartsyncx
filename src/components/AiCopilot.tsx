import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Send, Sparkles, ShieldCheck, TriangleAlert, RefreshCw } from 'lucide-react';
import { heartsync } from '../store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'How do I tell my partner I feel unheard without starting a fight?',
  'What are green flags I should look for when dating someone new?',
  'How do I set a boundary with a parent who keeps crossing lines?',
  'How do I rebuild trust in myself after a painful breakup?'
];

const GUIDELINES_NOTE = 'HeartSync Guide offers reflective, evidence-informed perspective — it is not therapy or crisis care. If you are in danger or thinking of harming yourself, please contact local emergency services or a crisis hotline right away.';

export default function AiCopilot({ onNavigate }: { onNavigate: (tab: string, arg?: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setServiceError(null);
    setOfflineNotice(false);
    try {
      const res = await fetch('/api/advice/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.answer) {
        if (data.crisisFlag) {
          setOfflineNotice(true);
        }
        setMessages([...nextMessages, { role: 'assistant', content: data.answer }]);
      } else {
        if (res.status === 503) setOfflineNotice(true);
        setServiceError(data.error || 'The guide is unavailable right now.');
      }
    } catch {
      setServiceError('Could not reach the guide. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 mb-4">
          <Heart className="w-7 h-7 text-rose-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
          HeartSync Guide
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Ask anything about love, dating, communication, breakups, or self-growth.
          You get grounded, practical perspective — with real phrases you can use.
        </p>
      </div>

      {/* Conversation */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="h-[52vh] min-h-[320px] overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Sparkles className="w-6 h-6 text-rose-400 mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                Start with one of these, or type your own situation below.
              </p>
              <div className="mt-5 grid gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="text-left text-sm px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 bg-rose-500 text-white text-sm leading-relaxed whitespace-pre-wrap'
                    : 'max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap'
                }
              >
                {m.content}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:240ms]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          {offlineNotice && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                What you described may involve real risk. Please consider contacting local emergency
                services or a domestic-violence / crisis hotline — professional support matters here.
              </p>
            </div>
          )}
          {serviceError && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{serviceError}</p>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what's on your mind..."
              maxLength={2000}
              className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-2xl bg-rose-500 text-white p-3 disabled:opacity-40 hover:bg-rose-600 transition-colors"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-zinc-400 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {GUIDELINES_NOTE}
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Prefer to reflect privately? {' '}
        <button onClick={() => onNavigate('lovevault')} className="text-rose-500 hover:underline">
          Open your LoveVault journal
        </button>
      </p>
    </div>
  );
}
