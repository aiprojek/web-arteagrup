import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

type Outlet = 'artea' | 'janji-koffee' | 'semua';

const DrinkRecommender: React.FC = () => {
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [prompt, setPrompt] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getMenuContext = (outlet: Outlet | null): string => {
        const arteaMenu = `
            Artea Menu:
            - Teh Original (Classic tea, can be plain or sweet)
            - Teh Buah (Fruit teas: Lemon, Lychee, Passion Fruit, Strawberry)
            - Teh Series (Milk Tea, Green Tea, Green Tea Milk, Matcha)
            - Kopi Series (Americano, Special Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Cappuccino)
            - Creamy Series (Taro, Strawberry, Red Velvet, Mango)
            - Mojito Series (Soda-based drinks: Strawberry, Passion Fruit, Mango, Kiwi, Blue Ocean)
        `;
        const janjiKoffeeMenu = `
            Janji Koffee Menu:
            - Kopi Hitam: Americano, Espresso
            - Kopi Series: Spanish Latte, Butterscotch, Spesial Mix, Kapuccino, Vanilla, Tiramisu, Hazelnut, Brown Sugar
            - Non Kopi: Choco Malt, Matcha Latte, Creamy Green Tea, Lemon Squash, Blue Ocean
        `;

        switch(outlet) {
            case 'artea':
                return `You can ONLY recommend drinks from the Artea menu below.\n${arteaMenu}`;
            case 'janji-koffee':
                return `You can ONLY recommend drinks from the Janji Koffee menu below.\n${janjiKoffeeMenu}`;
            case 'semua':
            default:
                return `Here is the Artea Grup menu for context. You can recommend drinks from EITHER Artea OR Janji Koffee.\n${arteaMenu}\n\n${janjiKoffeeMenu}`;
        }
    };

    const getRecommendation = async () => {
        if (!prompt) {
            setError('Tolong beri tahu kami apa yang kamu inginkan!');
            return;
        }

        setIsLoading(true);
        setRecommendation('');
        setError('');

        const apiKey = "AIzaSyALFWq0IdszSf2XqN3C_R58enA5SdkE8Gc";
        if (!apiKey) {
            setError('Konfigurasi Kunci API tidak ditemukan. Fitur AI tidak dapat berfungsi di lingkungan hosting ini tanpa Kunci API yang valid.');
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const menuContext = getMenuContext(selectedOutlet);

            const fullPrompt = `
                You are a friendly and enthusiastic barista for Artea Grup, a beverage brand in Indonesia. Your goal is to give personalized drink recommendations from our menu. Speak in a friendly, casual Indonesian tone. Keep your responses concise and exciting, under 60 words.

                ${menuContext}

                User's craving: "${prompt}"

                Based on the user's craving, suggest ONE drink and briefly explain why it's a great choice for them. Use markdown for emphasis (e.g., **bold** for drink names). Start your response with a fun greeting.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });

            setRecommendation(response.text);

        } catch (e) {
            console.error(e);
            setError('Maaf, terjadi kesalahan saat memberikan rekomendasi. Coba lagi nanti ya.');
        } finally {
            setIsLoading(false);
        }
    };

    const outletDetails: Record<Outlet, { name: string; icon: string }> = {
        artea: { name: 'Artea', icon: 'bi-cup-straw' },
        'janji-koffee': { name: 'Janji Koffee', icon: 'bi-cup-hot-fill' },
        semua: { name: 'Semua Outlet', icon: 'bi-shop' },
    };

    return (
        <div className="flex flex-col h-full">
            <div className="text-center">
                 <h2 className="text-2xl font-bold text-white mb-2">Temukan Minuman Favoritmu!</h2>
                 <p className="text-stone-400 mb-6">
                    {selectedOutlet ? 'Beri tahu Barista AI kami apa yang kamu suka!' : 'Pilih dulu outletnya ya!'}
                 </p>
            </div>

            <div className="w-full max-w-lg mx-auto space-y-4">
                {!selectedOutlet ? (
                    <div className="animate-fade-in-content space-y-4">
                        <button 
                            onClick={() => setSelectedOutlet('artea')}
                            className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="bi bi-cup-straw text-3xl mb-2 text-green-400"></i>
                            <span className="font-bold">Artea</span>
                            <span className="text-xs text-stone-400">Teh, Kopi, Creamy, & Mojito</span>
                        </button>
                        <button 
                            onClick={() => setSelectedOutlet('janji-koffee')}
                            className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="bi bi-cup-hot-fill text-3xl mb-2 text-amber-400"></i>
                            <span className="font-bold">Janji Koffee</span>
                            <span className="text-xs text-stone-400">Spesialis Kopi & Minuman Non-Kopi</span>
                        </button>
                        <button 
                            onClick={() => setSelectedOutlet('semua')}
                            className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="bi bi-shop text-3xl mb-2 text-sky-400"></i>
                            <span className="font-bold">Semua Outlet</span>
                            <span className="text-xs text-stone-400">Lihat semua kemungkinan</span>
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in-content">
                        <div className="bg-stone-900/50 p-3 rounded-lg border border-stone-700 text-sm mb-4 flex justify-between items-center">
                            <div className="flex items-center">
                                <i className={`${outletDetails[selectedOutlet].icon} mr-2 text-[var(--accent-color)]`}></i>
                                <span className="text-stone-300">Outlet terpilih: <strong className="text-white">{outletDetails[selectedOutlet].name}</strong></span>
                            </div>
                            <button onClick={() => setSelectedOutlet(null)} className="text-xs font-semibold text-[var(--accent-color)] hover:opacity-80">Ganti</button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Contoh: 'Saya ingin minuman yang segar dan ada rasa buahnya, tapi bukan kopi.'"
                            className="w-full h-28 p-3 bg-stone-700/50 border-2 border-stone-600 rounded-lg text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors"
                            aria-label="Describe your craving"
                            disabled={isLoading}
                        />
                        <button
                            onClick={getRecommendation}
                            disabled={isLoading}
                            className="w-full mt-4 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Mencarikan...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-magic mr-2"></i>
                                    Beri Rekomendasi
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                
                {recommendation && (
                    <div className="mt-6 bg-stone-900/50 p-4 rounded-lg border border-stone-700 animate-fade-in-content">
                        <h3 className="font-semibold text-white mb-2 flex items-center">
                            <i className="bi bi-robot mr-2 text-[var(--accent-color)]"></i>
                            Rekomendasi dari Barista AI:
                        </h3>
                        <MarkdownRenderer text={recommendation} />
                    </div>
                )}
            </div>
             <style>{`
                .animate-fade-in-content {
                    animation: fade-in-content 0.5s ease-out forwards;
                }
                @keyframes fade-in-content {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DrinkRecommender;