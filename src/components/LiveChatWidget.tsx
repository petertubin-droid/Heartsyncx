import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Smile, Paperclip, Check, CheckCheck, Loader2, Headset } from 'lucide-react';
import { heartsync } from '../store';
import { ChatMessage, ChatAttachment } from '../types';

const EMOJIS = ['👋', '❤️', '😊', '🙏', '🙌', '💡', '🌱', '💬', '🔥', '🌸', '☀️'];

export default function LiveChatWidget() {
  const [storeState, setStoreState] = useState({
    site_settings: heartsync.site_settings,
    current_user: heartsync.current_user,
    chat_messages: heartsync.chat_messages,
    chat_conversations: heartsync.chat_conversations
  });

  const [isOpen, setIsOpen] = useState(false);
  const [visitorId, setVisitorId] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [offlineFormSubmitted, setOfflineFormSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Offline form state
  const [offlineName, setOfflineName] = useState('');
  const [offlineEmail, setOfflineEmail] = useState('');
  const [offlineMsg, setOfflineMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5 seconds delay to show the widget
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Sync store updates
  useEffect(() => {
    const cb = () => {
      setStoreState({
        site_settings: { ...heartsync.site_settings },
        current_user: heartsync.current_user ? { ...heartsync.current_user } : null,
        chat_messages: [...heartsync.chat_messages],
        chat_conversations: [...heartsync.chat_conversations]
      });
    };
    const unsubscribe = heartsync.subscribe(cb);
    return () => unsubscribe();
  }, []);

  // Generate or retrieve visitor ID
  useEffect(() => {
    if (storeState.current_user) {
      setVisitorId(storeState.current_user.id);
    } else {
      let storedId = typeof window !== 'undefined' ? sessionStorage.getItem('hs_chat_visitor_id') : null;
      if (!storedId) {
        storedId = `visitor-${Math.random().toString(36).substr(2, 9)}`;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hs_chat_visitor_id', storedId);
        }
      }
      setVisitorId(storedId);
    }
  }, [storeState.current_user]);

  const activeConvId = `conv-${visitorId}`;
  const conversationMessages = storeState.chat_messages.filter(m => m.conversation_id === activeConvId);
  const activeConversation = storeState.chat_conversations.find(c => c.id === activeConvId);

  const hasUnread = conversationMessages.some(m => m.sender === 'admin' && !m.is_read);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Mark all admin messages as read when window is open
      const unreadMsgs = conversationMessages.filter(m => m.sender === 'admin' && !m.is_read);
      if (unreadMsgs.length > 0) {
        unreadMsgs.forEach(m => {
          m.is_read = true;
        });
        heartsync.saveState();
      }
    }
  }, [isOpen, conversationMessages.length]);

  // If live chat is globally disabled in site_settings, do not render anything
  if (storeState.site_settings.live_chat_enabled === false) {
    return null;
  }

  // Detect basic device, browser details
  const getDeviceMeta = () => {
    if (typeof window === 'undefined') return {};
    const ua = navigator.userAgent;
    let browser = 'Other';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    
    let device = 'Desktop';
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = 'Mobile';
    
    return {
      browser,
      device,
      current_page: window.location.pathname,
      country: Intl.DateTimeFormat().resolvedOptions().timeZone || navigator.language || 'Global'
    };
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);

    // Identify guest names automatically if we can
    const guestMeta = storeState.current_user ? {
      name: storeState.current_user.name,
      email: storeState.current_user.email,
    } : {
      name: (typeof window !== 'undefined' ? sessionStorage.getItem('hs_chat_visitor_name') : null) || undefined,
      email: (typeof window !== 'undefined' ? sessionStorage.getItem('hs_chat_visitor_email') : null) || undefined
    };

    setIsTyping(true);
    await heartsync.sendChatMessage(
      visitorId,
      textToSend,
      'visitor',
      [],
      activeConvId,
      {
        ...getDeviceMeta(),
        ...guestMeta
      }
    );
    setIsTyping(false);
  };

  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName.trim() || !offlineEmail.trim() || !offlineMsg.trim()) return;

    // Save Guest Info in SessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hs_chat_visitor_name', offlineName);
      sessionStorage.setItem('hs_chat_visitor_email', offlineEmail);
    }

    setIsTyping(true);
    // Create pending conversation with visitors email & details
    await heartsync.sendChatMessage(
      visitorId,
      `[OFFLINE TICKET]\nName: ${offlineName}\nEmail: ${offlineEmail}\n\nMessage: ${offlineMsg}`,
      'visitor',
      [],
      activeConvId,
      {
        ...getDeviceMeta(),
        name: offlineName,
        email: offlineEmail
      }
    );
    setIsTyping(false);
    setOfflineFormSubmitted(true);
    setOfflineMsg('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Only images are allowed as attachments');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Upload image attachment via Heartsync Store / Supabase Storage
    try {
      const mediaUrl = await heartsync.uploadMedia(file);
      const attachment: ChatAttachment = {
        name: file.name,
        url: mediaUrl,
        size: file.size,
        type: file.type
      };

      await heartsync.sendChatMessage(
        visitorId,
        `Shared an image: ${file.name}`,
        'visitor',
        [attachment],
        activeConvId,
        {
          ...getDeviceMeta(),
          name: (typeof window !== 'undefined' ? sessionStorage.getItem('hs_chat_visitor_name') : null) || undefined,
          email: (typeof window !== 'undefined' ? sessionStorage.getItem('hs_chat_visitor_email') : null) || undefined
        }
      );
    } catch (uploadErr) {
      console.error('Failed to upload chat image attachment:', uploadErr);
      alert('Failed to process image attachment.');
    }
  };

  // Determine colors based on site branding settings
  const primaryColor = storeState.site_settings.primary_color || '#f43f5e';

  // Is administrative help offline?
  // We determine offline when no admin is active or just toggleable.
  // For demo realism: if the conversation is closed or we want to allow guests to leave ticket
  const isOfflineMode = !storeState.current_user && storeState.chat_conversations.length > 5;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none" id="heartsync-live-chat">
      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isVisible && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[80vh] rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-150 dark:border-zinc-800 flex flex-col overflow-hidden pointer-events-auto mb-4"
          >
            {/* Header */}
            <div 
              className="px-6 py-4 text-white flex items-center justify-between shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-inner">
                    <img 
                      src={storeState.site_settings.logo_url || '/logo.svg'} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOfflineMode ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-tight text-white leading-none">HeartSync Concierge</h3>
                  <p className="text-[10px] text-white/80 mt-1 font-medium font-mono">
                    {isOfflineMode ? 'OFFLINE • TICKETS ACCEPTED' : 'ONLINE • READY TO CHAT'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                aria-label="Close live chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-900/40 space-y-4">
              {/* Automated Welcome Message */}
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-xs overflow-hidden">
                  <img src="/support_avatar.jpg" alt="HeartSync Support" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-150 text-xs shadow-sm border border-zinc-100 dark:border-zinc-800/60 leading-relaxed rounded-tl-none">
                    👋 Hi! Welcome to HeartSync. How can we help you today?
                  </div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 ml-2 mt-1 block">
                    Just now
                  </span>
                </div>
              </div>

              {/* Message List */}
              {conversationMessages.map((msg) => {
                const isVisitor = msg.sender === 'visitor';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-2.5 max-w-[85%] ${isVisitor ? 'ml-auto justify-end' : ''}`}
                  >
                    {!isVisitor && (
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-xs overflow-hidden">
                        <img src="/support_avatar.jpg" alt="Admin" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div 
                        className={`p-3.5 rounded-3xl text-xs shadow-sm border leading-relaxed ${
                          isVisitor 
                            ? 'text-white rounded-tr-none' 
                            : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-150 rounded-tl-none border-zinc-100 dark:border-zinc-800/60'
                        }`}
                        style={{ 
                          backgroundColor: isVisitor ? primaryColor : undefined,
                          borderColor: isVisitor ? primaryColor : undefined
                        }}
                      >
                        {msg.content}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.map((att, i) => (
                          <div key={i} className="mt-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-w-full">
                            <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="max-w-full h-auto object-cover max-h-48" />
                          </div>
                        ))}
                      </div>
                      
                      <div className={`flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 dark:text-zinc-500 ${isVisitor ? 'justify-end mr-2' : 'ml-2'}`}>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isVisitor && (
                          <span>
                            {msg.is_read ? <CheckCheck size={10} className="text-emerald-500" /> : <Check size={10} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Simulated typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                    <Loader2 size={12} className="animate-spin text-zinc-400" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 text-xs shadow-sm border border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* Offline Ticket Mode Form */}
              {isOfflineMode && !offlineFormSubmitted && conversationMessages.length > 0 && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    📬 We're currently away. Leave a direct ticket and we will respond instantly to your email:
                  </p>
                  <form onSubmit={handleOfflineSubmit} className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      required
                      value={offlineName}
                      onChange={e => setOfflineName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-zinc-800 dark:text-white"
                    />
                    <input 
                      type="email" 
                      placeholder="Your Email" 
                      required
                      value={offlineEmail}
                      onChange={e => setOfflineEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-zinc-800 dark:text-white"
                    />
                    <textarea 
                      placeholder="Describe what we can help with..." 
                      required
                      rows={3}
                      value={offlineMsg}
                      onChange={e => setOfflineMsg(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-zinc-800 dark:text-white resize-none"
                    />
                    <button 
                      type="submit"
                      className="w-full text-xs py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                    >
                      Submit Ticket
                    </button>
                  </form>
                </div>
              )}

              {offlineFormSubmitted && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-[11px] leading-relaxed">
                  Thank you! Your request was stored as a pending ticket. We'll reply shortly to your provided email address.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Selector */}
            {showEmojiPicker && (
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between gap-1 flex-wrap">
                {EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => {
                      setInputText(prev => prev + emoji);
                    }}
                    className="text-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-zinc-950">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Attach photo"
              >
                <Paperclip size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*" 
                className="hidden" 
              />

              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Insert emoji"
              >
                <Smile size={18} />
              </button>

              <div className="flex-1 relative flex items-center">
                <input 
                  type="text" 
                  value={inputText}
                  maxLength={500}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={isOfflineMode ? "Send a quick note..." : "Type your message..."}
                  className="w-full text-xs pl-3 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-150 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <span className="absolute right-3 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {inputText.length}/500
                </span>
              </div>

              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTON */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: isOpen ? 0 : [0, -8, 0] 
            }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            transition={{
              scale: { type: 'spring', stiffness: 260, damping: 20 },
              opacity: { duration: 0.3 },
              y: isOpen 
                ? { type: 'spring', stiffness: 260, damping: 20 } 
                : { repeat: Infinity, repeatType: 'reverse', duration: 3, ease: 'easeInOut' }
            }}
            className="pointer-events-auto"
          >
            <motion.button
              layout
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)'
              }}
              whileTap={{ scale: 0.95 }}
              className={`shadow-2xl flex items-center relative cursor-pointer focus:outline-none border border-white/10 dark:border-zinc-800/20 ${
                isOpen 
                  ? 'w-14 h-14 rounded-full justify-center' 
                  : 'h-[54px] w-[138px] rounded-full justify-between pl-4 pr-1.5'
              }`}
              style={{ backgroundColor: primaryColor }}
              id="heartsync-live-chat-toggle"
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center text-white"
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-between relative"
                  >
                    <span className="text-white font-semibold text-[15px] select-none tracking-wider">
                      Chat
                    </span>
                    
                    {/* Speech Bubble Icon Circle (Slightly darker shade overlay) */}
                    <div className="w-10 h-10 bg-black/15 hover:bg-black/25 rounded-full flex items-center justify-center shadow-inner transition-colors">
                      <MessageCircle size={20} className="text-white fill-white" />
                    </div>

                    {/* Green Active Dot overlapping the bottom-left of the pill button */}
                    <div className="absolute -bottom-[6px] -left-[10px] w-4.5 h-4.5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-zinc-950 shadow-md flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulse badge for unread/active alerts */}
              {hasUnread && !isOpen && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-4 w-4"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white text-[8px] items-center justify-center font-bold text-white leading-none">
                    !
                  </span>
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
