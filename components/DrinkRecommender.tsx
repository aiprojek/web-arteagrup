import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
// FIX: Added getMenuForOutlet to imports and used it to provide the necessary second argument to getLocalRecommendation.
import { getLocalRecommendation, LocalResult, getMenuForOutlet } from '../lib/LocalRecommender';
import { GroundingChunk, ChatMessage } from '../types';

const DrinkRecommender: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);


    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('artea-grup-chat-history');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load chat history from localStorage", e);
            setError("Gagal memuat riwayat percakapan.");
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            if (history.length > 0) {
                localStorage.setItem('artea-grup-chat-history', JSON.stringify(history));
            } else {
                localStorage.removeItem('artea-grup-chat-history'); // Clean up if history is cleared
            }
        } catch (e) {
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                setError('Penyimpanan lokal penuh! Riwayat percakapan tidak dapat disimpan. Mohon reset percakapan.');
            } else {
                console.error("Failed to save chat history:", e);
            }
        }
    }, [history]);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history, isLoading]);
    
    // Effect for closing menu on outside click or escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);


    const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        const prompt = currentMessage.trim();

        if (!prompt || isLoading) {
            return;
        }

        setError('');
        setIsLoading(true);

        const newUserMessage: ChatMessage = { role: 'user', content: prompt };
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setCurrentMessage('');

        // 1. Try local AI first.
        // FIX: The local recommender needs the list of available menu items to check against.
        // We'll provide the combined menu from both outlets since this is a general assistant.
        const availableMenu = getMenuForOutlet('semua');
        const localResult = getLocalRecommendation(prompt, availableMenu);
        if (localResult) {
            let content = '';
             if (localResult.type === 'recommendation') {
                switch (localResult.reason) {
                    case 'Rekomendasi Hari Ini':
                        content = `Tentu! **Rekomendasi Hari Ini** dari Asisten AI jatuh kepada... **${localResult.drink}**! Minuman ini pas banget buat nemenin harimu. Selamat mencoba!`;
                        break;
                    case 'Minuman Terlaris':
                        content = `Tentu! Salah satu **Minuman Terlaris** kami adalah **${localResult.drink}**. Banyak banget yang suka, kamu wajib coba!`;
                        break;
                    default:
                        if (localResult.reason.toLowerCase() === localResult.drink.toLowerCase()) {
                            content = `Tentu, kami punya **${localResult.drink}**. Pilihan yang mantap! Kamu pasti suka.`;
                        } else {
                           content = `Tentu! Untuk kamu yang lagi cari minuman **${localResult.reason}**, sepertinya kamu bakal suka banget sama **${localResult.drink}**. Cobain deh!`;
                        }
                }
            } else if (localResult.type === 'definition') {
                content = localResult.content;
            }
            
            const aiMessage: ChatMessage = { role: 'model', content };
            setHistory(prev => [...prev, aiMessage]);
            setIsLoading(false);
            return;
        }


        // 2. Fallback to Gemini API via our proxy
        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, history }), // Send previous history for context
            });

            if (!response.ok) {
                // Coba parse error dari body response untuk pesan yang lebih jelas
                let errorMsg = `Server merespons dengan status ${response.status}.`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (jsonError) {
                    // Jika body bukan JSON, mungkin ada pesan error lain
                    console.error('Could not parse error JSON from server:', jsonError);
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const aiMessage: ChatMessage = { role: 'model', content: data.text, sources: data.sources };
            setHistory(prev => [...prev, aiMessage]);

        } catch (e) {
            console.error(e);
             // Tampilkan pesan error yang lebih spesifik yang kita dapatkan
            const specificError = e instanceof Error ? e.message : 'Terjadi kesalahan tidak diketahui.';
            setError(`Duh, AI kami sepertinya sedang istirahat. (${specificError})`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setHistory([]);
        setError('');
        setIsMenuOpen(false); // Close menu after action
    }

    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-full">
            <header className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-stone-700/50">
                <div className="text-left">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Asisten AI Artea Grup</h2>
                    <p className="text-sm text-stone-400">Tanya apa saja seputar menu & lokasi.</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-stone-300 hover:text-white transition-colors bg-stone-700/50 hover:bg-stone-700 rounded-full"
                        aria-label="Opsi lainnya"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                    >
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                    </button>
                    {isMenuOpen && (
                         <div className="absolute top-full right-0 mt-2 w-56 bg-stone-800/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-down z-10">
                            <ul className="text-white text-sm" role="menu">
                                <li role="menuitem">
                                    <button
                                        onClick={handleReset}
                                        className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors"
                                    >
                                        <i className="bi bi-arrow-clockwise w-8 text-center text-base"></i>
                                        <span>Reset Percakapan</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </header>

            <div ref={chatContainerRef} className="flex-grow w-full overflow-y-auto py-4 space-y-4">
                {history.length === 0 && !isLoading && (
                    <div className="text-center text-stone-400 p-8 flex flex-col items-center h-full justify-center">
                         <i className="bi bi-chat-quote-fill text-4xl mb-4 text-[var(--accent-color)]"></i>
                         <p className="font-semibold">Selamat datang!</p>
                         <p className="text-sm">Saya asisten AI Artea Grup. Ada yang bisa dibantu?</p>
                    </div>
                )}
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md lg:max-w-lg rounded-xl px-4 py-2 ${msg.role === 'user' ? 'bg-[var(--accent-color)] text-white rounded-br-none' : 'bg-stone-700/80 text-stone-200 rounded-bl-none'}`}>
                            <MarkdownRenderer text={msg.content} />
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-stone-600">
                                     <h4 className="text-xs font-semibold text-stone-300 mb-1">Sumber:</h4>
                                     <ul className="space-y-1">
                                        {msg.sources.map((source, idx) => source.web?.uri ? (
                                            <li key={idx}>
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 truncate block">
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ) : null)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-xs rounded-xl px-4 py-3 bg-stone-700/80 text-stone-200 rounded-bl-none flex items-center space-x-2">
                           <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse-fast"></div>
                           <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse-fast animation-delay-200"></div>
                           <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse-fast animation-delay-400"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-stone-700/50">
                 {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Ketik pesanmu di sini..."
                        className="w-full flex-grow p-3 bg-stone-700/50 border-2 border-stone-600 rounded-lg text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors"
                        aria-label="Ketik pesan untuk asisten AI"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !currentMessage}
                        className="w-12 h-12 flex-shrink-0 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                        aria-label="Kirim pesan"
                    >
                       <i className="bi bi-send-fill"></i>
                    </button>
                </form>
            </div>
             <style>{`
                .animate-pulse-fast {
                    animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animation-delay-200 { animation-delay: 200ms; }
                .animation-delay-400 { animation-delay: 400ms; }

                @keyframes pulse {
                    50% { opacity: .5; }
                }
                 @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                    transform-origin: top right;
                }
            `}</style>
        </div>
    );
};

export default DrinkRecommender;
