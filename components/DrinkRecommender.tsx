
import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { getLocalRecommendation, getMenuForOutlet } from '../lib/LocalRecommender';
import { ChatMessage } from '../types';
import VoiceChatModal from './VoiceChatModal';

const DrinkRecommender: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    
    // New state for personalization
    const [userName, setUserName] = useState<string | null>(null);
    const [awaitingName, setAwaitingName] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Initialize Data
    useEffect(() => {
        try {
            // 1. Load Name
            const storedName = localStorage.getItem('artea-user-name');
            if (storedName) {
                setUserName(storedName);
            }

            // 2. Load History
            const savedHistory = localStorage.getItem('artea-grup-chat-history');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            } else {
                // 3. If No History, Initialize Conversation
                if (storedName) {
                    setHistory([{ 
                        role: 'model', 
                        content: `Halo Kak **${storedName}**! Senang bertemu kembali. 👋\n\nAda yang bisa saya bantu seputar menu atau lokasi Artea Grup hari ini?` 
                    }]);
                } else {
                    setAwaitingName(true);
                    setHistory([{ 
                        role: 'model', 
                        content: "Halo! Saya asisten AI Artea Grup. Supaya lebih akrab, boleh tau siapa nama Kakak?" 
                    }]);
                }
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            setError("Gagal memuat data lokal.");
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            if (history.length > 0) {
                localStorage.setItem('artea-grup-chat-history', JSON.stringify(history));
            } else {
                localStorage.removeItem('artea-grup-chat-history');
            }
        } catch (e) {
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                setError('Penyimpanan lokal penuh! Riwayat percakapan tidak dapat disimpan.');
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
    }, [history, isLoading, awaitingName]);
    
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

        // --- SPECIAL FLOW: SETTING NAME ---
        if (awaitingName) {
            // Treat input as name
            const newName = prompt; 
            
            localStorage.setItem('artea-user-name', newName);
            setUserName(newName);
            setAwaitingName(false);

            // Update UI with User's name immediately
            const newUserMessage: ChatMessage = { role: 'user', content: newName };
            const displayHistory = [...history, newUserMessage];
            setHistory(displayHistory);
            setCurrentMessage('');

            // Construct a special system-directed prompt for the AI
            const specialPrompt = `Nama saya adalah "${newName}". 
            Tugasmu adalah melakukan hal berikut secara berurutan dalam satu respon:
            1. Berikan pujian yang tulus dan hangat mengenai nama tersebut (gunakan pengetahuan umum).
            2. **Wajib:** Ucapkan doa yang baik untuk saya (misalnya: semoga sehat selalu, rejekinya lancar, atau dimudahkan urusannya).
            3. Sapa saya kembali dengan nama tersebut dan tawarkan bantuan seputar menu minuman Artea atau Janji Koffee.
            
            Gunakan bahasa Indonesia yang gaul tapi sopan, ramah, dan akrab layaknya barista favorit.`;

            // Try Primary API -> Fallback API -> Local Mock
            try {
                // 1. Primary API
                const response = await fetch('/api/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: specialPrompt, history }), 
                });

                if (!response.ok) throw new Error(`Primary API Error: ${response.status}`);

                const data = await response.json();
                const aiMessage: ChatMessage = { role: 'model', content: data.text, sources: data.sources };
                setHistory(prev => [...prev, aiMessage]);

            } catch (primaryError) {
                console.warn("Primary API failed, trying fallback...", primaryError);
                try {
                     // 2. Fallback API (Pollinations)
                     const fallbackSystem = `
                        Kamu adalah "Artea AI", asisten barista.
                        User baru saja mengenalkan diri bernama: ${newName}.
                        Tugas: Puji namanya, berikan doa baik (semoga sehat/lancar rejeki), lalu tawarkan menu Artea/Janji Koffee.
                        Gaya: Ramah, Gaul, Sopan.
                     `;
                     const fallbackUrl = `https://text.pollinations.ai/${encodeURIComponent(fallbackSystem)}?model=openai`;
                     const fbResponse = await fetch(fallbackUrl);
                     if (!fbResponse.ok) throw new Error('Fallback API Failed');
                     const fbText = await fbResponse.text();
                     
                     setHistory(prev => [...prev, { role: 'model', content: fbText }]);
                } catch (fallbackError) {
                    // 3. Last Resort (Local Mock)
                    const fallbackMessage = `Wah, nama yang bagus! Salam kenal ya Kak **${newName}**. Semoga hari Kakak menyenangkan dan penuh berkah! Ada yang bisa saya bantu soal menu hari ini?`;
                    setHistory(prev => [...prev, { role: 'model', content: fallbackMessage }]);
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }
        // ----------------------------------

        // Regular Chat Flow
        const newUserMessage: ChatMessage = { role: 'user', content: prompt };
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setCurrentMessage('');

        // STRATEGY CHANGE: 
        // We do NOT run local AI first anymore to prevent "ngawur" answers.
        // We try the Smart APIs first. Local AI is only a catastrophe fallback.

        try {
            // 1. Try Gemini API via Cloudflare
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, history }), 
            });

            if (!response.ok) {
                 throw new Error(`Primary API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiMessage: ChatMessage = { role: 'model', content: data.text, sources: data.sources };
            setHistory(prev => [...prev, aiMessage]);

        } catch (e) {
            console.warn("Primary API failed, attempting Fallback...", e);
            
            // 2. FALLBACK: Pollinations.ai (Free, Unlimited, No Login)
            try {
                // FALLBACK SYSTEM INSTRUCTION - DIUPDATE AGAR KONSISTEN DENGAN SERVER
                const systemContext = `
                    Kamu adalah "Artea AI", asisten barista Artea Grup.
                    Gaya bahasa: Gaul, sopan, ramah, panggil user "Kak".
                    
                    PENGETAHUAN MENU ARTEA GRUP (STRICT):
                    
                    BRAND 1: ARTEA (Teh & Segar)
                    - Teh: Teh Original, Teh Lemon, Teh Leci, Teh Markisa, Teh Strawberry.
                    - Milk Tea: Milk Tea, Green Tea, Green Tea Milk, Matcha.
                    - Creamy: Taro, Strawberry, Red Velvet, Mangga.
                    - Kopi: Americano, Spesial Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Kappucino.
                    - Mojito: Strawberry, Markisa, Mangga, Kiwi, Blue Ocean.
                    (Menu Artea TIDAK BISA custom).

                    BRAND 2: JANJI KOFFEE (Kopi & Custom)
                    - Kopi: Americano, Long Black, Espresso, Spanish Latte (Best Seller), Butterscotch, Spesial Mix, Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar.
                    - Non-Kopi: Choco Malt, Creamy Matcha, Creamy Green Tea, Lemon Squash, Blue Ocean.
                    
                    CUSTOM ORDER (KHUSUS JANJI KOFFEE):
                    - Espresso: Arabika/Robusta (Soft-Bold).
                    - Gula: Tebu/Stevia (1-4 Tetes).
                    - Sirup: Butterscotch, Vanilla, dll.
                    - Add-ons: Krimer, SKM, Coklat, Susu UHT.
                    
                    JANGAN berhalusinasi menu lain.
                `;

                // Build context prompt
                const lastTurn = history.length > 0 ? history[history.length - 1].content : '';
                const fullPrompt = `${systemContext}\n\nUser: ${lastTurn}\nUser Input Baru: ${prompt}\nArtea AI:`;
                
                const fallbackUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`;
                const fbResponse = await fetch(fallbackUrl);
                
                if(!fbResponse.ok) throw new Error("Fallback API failed");
                
                const fbText = await fbResponse.text();
                const aiMessage: ChatMessage = { role: 'model', content: fbText };
                setHistory(prev => [...prev, aiMessage]);
                setError(''); 

            } catch (fallbackError) {
                console.error("All APIs failed, using Local Dictionary:", fallbackError);
                
                // 3. FINAL FALLBACK: Local Dictionary
                // This only runs if INTERNET AI is dead.
                const availableMenu = getMenuForOutlet('semua');
                const localResult = getLocalRecommendation(prompt, availableMenu);
                
                let content = '';
                if (localResult) {
                    if (localResult.type === 'recommendation') {
                        content = `Maaf Kak, server lagi sibuk banget nih. Tapi kalau dari kata kuncinya, aku saranin coba **${localResult.drink}** deh!`;
                    } else if (localResult.type === 'definition') {
                        content = localResult.content;
                    }
                } else {
                    const specificError = e instanceof Error ? e.message : 'Gangguan jaringan.';
                    content = `Maaf Kak, sistem lagi down nih (${specificError}). Boleh coba tanya yang lain?`;
                }
                
                setHistory(prev => [...prev, { role: 'model', content }]);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setError('');
        setIsMenuOpen(false);
        
        // Keep name, just reset chat
        if (userName) {
             setHistory([{ role: 'model', content: `Halo lagi Kak **${userName}**! Mari kita mulai dari awal. Ada yang bisa dibantu?` }]);
             setAwaitingName(false);
        } else {
             // Full reset if no name
             setHistory([{ role: 'model', content: "Halo! Boleh tau siapa nama Kakak?" }]);
             setAwaitingName(true);
        }
    }

    const handleChangeName = () => {
        setIsMenuOpen(false);
        setAwaitingName(true);
        setUserName(null);
        localStorage.removeItem('artea-user-name');
        localStorage.removeItem('artea-grup-chat-history');
        setHistory([{ role: 'model', content: "Siap! Kalau begitu, siapa nama kamu yang sekarang?" }]);
    }

    // Callback called when Voice AI captures a new name
    const handleVoiceNameUpdate = (newName: string) => {
        setUserName(newName);
        setAwaitingName(false);
        // Add a system note to chat history so the user sees what happened in voice mode
        const noteMessage: ChatMessage = { 
            role: 'model', 
            content: `*(Obrolan Suara)* Salam kenal, Kak **${newName}**! Nama Kakak sudah saya simpan. 😊` 
        };
        setHistory(prev => [...prev, noteMessage]);
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-full relative">
            <header className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-stone-700/50">
                <div className="text-left">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Asisten AI Artea</h2>
                    <p className="text-xs md:text-sm text-stone-400 truncate max-w-[200px]">
                        {userName ? `Halo, ${userName}!` : 'Asisten Virtual'}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                     {/* Voice Call Button */}
                     <button
                        onClick={() => setIsVoiceModalOpen(true)}
                        className="w-10 h-10 flex items-center justify-center text-white bg-green-600 hover:bg-green-500 rounded-full shadow-lg transition-all animate-bounce-slight"
                        aria-label="Telepon AI"
                        title="Ngobrol langsung dengan AI"
                    >
                        <i className="bi bi-telephone-fill text-sm"></i>
                    </button>

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
                                    <li role="menuitem">
                                        <button
                                            onClick={handleChangeName}
                                            className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors border-t border-white/10"
                                        >
                                            <i className="bi bi-person-badge w-8 text-center text-base"></i>
                                            <span>Ganti Nama</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div ref={chatContainerRef} className="flex-grow w-full overflow-y-auto py-4 space-y-4">
                
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md lg:max-w-lg rounded-xl px-4 py-2 shadow-sm ${msg.role === 'user' ? 'bg-[var(--accent-color)] text-white rounded-br-none' : 'bg-stone-700/80 text-stone-200 rounded-bl-none'}`}>
                            <MarkdownRenderer text={msg.content} />
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-stone-600/50">
                                     <h4 className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">Sumber:</h4>
                                     <ul className="space-y-1">
                                        {msg.sources.map((source, idx) => source.web?.uri ? (
                                            <li key={idx}>
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 truncate block flex items-center">
                                                    <i className="bi bi-link-45deg mr-1"></i>
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
                 {error && <p className="text-red-400 text-center text-sm mb-2 bg-red-900/20 py-1 rounded animate-pulse">{error}</p>}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder={awaitingName ? "Ketik nama kamu..." : "Ketik pesanmu di sini..."}
                        className="w-full flex-grow p-3 bg-stone-700/50 border-2 border-stone-600 rounded-lg text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors"
                        aria-label={awaitingName ? "Masukkan nama anda" : "Ketik pesan untuk asisten AI"}
                        disabled={isLoading}
                        autoFocus={awaitingName}
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
            
            {/* Voice Chat Modal */}
            <VoiceChatModal 
                isOpen={isVoiceModalOpen} 
                onClose={() => setIsVoiceModalOpen(false)}
                userName={userName}
                onNameSave={handleVoiceNameUpdate}
            />

             <style>{`
                .animate-pulse-fast {
                    animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animation-delay-200 { animation-delay: 200ms; }
                .animation-delay-400 { animation-delay: 400ms; }
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-slight {
                    animation: bounce-slight 2s infinite;
                }
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
