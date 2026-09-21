import React, { useRef, useState } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { heartsync } from '../store';

/**
 * Article TTS reader — the server-side /api/tts endpoint (ElevenLabs, with
 * the admin-configured voice) existed but the site never exposed a player.
 * This revives the feature: chunked sequential playback of the article.
 */
const MAX_CHUNK = 1400; // server caps each synthesis at 1500 chars

function splitIntoChunks(raw: string): string[] {
  const text = raw
    .replace(/!\[.*?\]\(.*?\)/g, '')          // drop images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')       // links -> anchor text
    .replace(/```[\s\S]*?```/g, '')           // drop code blocks
    .replace(/[#*_>`~|]/g, ' ')               // strip markdown emphasis
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + ' ' + s).trim().length > MAX_CHUNK) {
      if (cur.trim()) chunks.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

export default function ArticleTTS({ content }: { content: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [part, setPart] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus('idle');
    setPart(0);
  };

  const playChunk = (parts: { audio: string; mimeType: string }[], i: number) => {
    if (i >= parts.length) { stop(); return; }
    setPart(i + 1);
    const { audio, mimeType } = parts[i];
    const el = new Audio(`data:${mimeType || 'audio/mpeg'};base64,${audio}`);
    audioRef.current = el;
    el.onended = () => playChunk(parts, i + 1);
    el.onerror = () => setStatus('error');
    el.play().catch(() => setStatus('error'));
    setStatus('playing');
  };

  const start = async () => {
    const chunks = splitIntoChunks(content);
    if (chunks.length === 0) { setStatus('error'); return; }
    setStatus('loading');
    try {
      const voice = (heartsync.site_settings as Record<string, unknown>).tts_selected_voice as string | undefined;
      const parts: { audio: string; mimeType: string }[] = [];
      for (const chunk of chunks) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk, voice: voice || 'rachel' })
        });
        if (!res.ok) throw new Error('tts unavailable');
        const data = await res.json();
        if (!data?.audio) throw new Error('no audio');
        parts.push({ audio: data.audio, mimeType: data.mimeType });
        if (parts.length === 1) playChunk(parts, 0); // start as soon as the first chunk is ready
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-[11px] text-zinc-400 py-1">
        <Volume2 className="w-3.5 h-3.5" />
        <span>Audio narration unavailable right now.</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={status === 'playing' ? stop : start}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-rose-400 dark:hover:border-rose-500/60 transition-all cursor-pointer shadow-sm"
      aria-label={status === 'playing' ? 'Stop audio narration' : 'Listen to this article'}
    >
      {status === 'playing' ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
          <span>Stop narration{part > 0 ? '' : ''}</span>
        </>
      ) : status === 'loading' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
          <span>Preparing narration…</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Listen to this article</span>
        </>
      )}
    </button>
  );
}
