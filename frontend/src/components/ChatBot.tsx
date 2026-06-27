import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Minus, Send, MessageSquare } from 'lucide-react';
import { FASTAPI_URL } from '../lib/config';
import { formatPrice, imageUrl } from '../lib/utils';

interface ProductCard {
  id: string;
  title: string;
  thumbnail: string | null;
  handle: string;
  price: number;
}

interface BotMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  products?: ProductCard[];
  timestamp: number;
}

const QUICK_ACTIONS = [
  'Floor Mats',
  'LED Lights',
  'Seat Covers',
  'Dash Cameras',
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const addWelcomeMessage = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: "Hi! Welcome to Car Tunez! 🚗 I can help you find the perfect car accessories. What are you looking for?",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addWelcomeMessage();
    }
  }, [isOpen, messages.length, addWelcomeMessage]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: BotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${FASTAPI_URL}/api/v1/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, session_id: sessionId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const botMsg: BotMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: data.response ?? data.message ?? "I couldn't process that. Could you rephrase?",
        products: data.products,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'bot',
          text: "Sorry, I'm having trouble connecting. Please try again or chat with us on WhatsApp!",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(`Show me ${action}`);
    },
    [sendMessage],
  );

  // ─── Floating toggle button ────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20b858] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  // ─── Chat window ───────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Panel */}
      <div
        className={`
          w-[calc(100vw-3rem)] sm:w-[380px] max-h-[500px] bg-white rounded-2xl shadow-2xl
          border border-gray-200 flex flex-col overflow-hidden
          transition-all duration-300 origin-bottom-right
          ${isMinimized ? 'h-14' : 'h-[500px]'}
        `}
      >
        {/* Header */}
        <div className="bg-[#25D366] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Car Tunez Assistant</h3>
              <p className="text-[10px] text-white/80">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <a
              href="https://wa.me/919949695030?text=Hi%20Car%20Tunez!%20I%27m%20interested%20in%20your%20car%20accessories."
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Chat on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <button
              onClick={() => setIsMinimized(v => !v)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsMinimized(false); }}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`
                        px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${msg.role === 'user'
                          ? 'bg-[#1a1a2e] text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                        }
                      `}
                    >
                      {msg.text}
                    </div>

                    {/* Product cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map(product => (
                          <div
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex gap-3"
                          >
                            <img
                              src={imageUrl(product.thumbnail)}
                              alt={product.title}
                              className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{product.title}</p>
                              <p className="text-xs font-semibold text-[#c91c1c] mt-0.5">
                                {product.price > 0 ? formatPrice(product.price) : 'Contact'}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <a
                                  href={`/product/${product.handle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className={`text-[10px] text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex gap-2 overflow-x-auto shrink-0">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#25D366] hover:text-white text-gray-600 transition-colors shrink-0"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] max-h-20"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#25D366] hover:bg-[#20b858] text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
