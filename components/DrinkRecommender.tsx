
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

const DrinkRecommender: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getRecommendation = async () => {
        if (!prompt) {
            setError('Tolong beri tahu kami apa yang kamu inginkan!');
            return;
        }

        setIsLoading(true);
        setRecommendation('');
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const fullPrompt = `
                You are a friendly and enthusiastic barista for Artea Grup, a beverage brand in Indonesia. Your goal is to give personalized drink recommendations from our menu. Speak in a friendly, casual Indonesian tone. Keep your responses concise and exciting, under 60 words.

                Here is the Artea Grup menu for context. You can recommend drinks from Artea or Janji Koffee.
                
                Artea Menu:
                - Teh Original (Classic tea, can be plain or sweet)
                - Teh Buah (Fruit teas: Lemon, Lychee, Passion Fruit, Strawberry)
                - Teh Series (Milk Tea, Green Tea, Green Tea Milk, Matcha)
                - Kopi Series (Americano, Special Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Cappuccino)
                - Creamy Series (Taro, Strawberry, Red Velvet, Mango)
                - Mojito Series (Soda-based drinks: Strawberry, Passion Fruit, Mango, Kiwi, Blue Ocean)

                Janji Koffee Menu:
                - Kopi Hitam: Americano, Espresso
                - Kopi Series: Spanish Latte, Butterscotch, Spesial Mix, Kapuccino, Vanilla, Tiramisu, Hazelnut, Brown Sugar
                - Non Kopi: Choco Malt, Matcha Latte, Creamy Green Tea, Lemon Squash, Blue Ocean

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

    return (
        <div className="flex flex-col h-full">
            <div className="text-center">
                 <h2 className="text-2xl font-bold text-white mb-2">Temukan Minuman Favoritmu!</h2>
                 <p className="text-stone-400 mb-6">Beri tahu kami apa yang kamu suka, dan biarkan AI kami memberikan rekomendasi spesial untukmu.</p>
            </div>

            <div className="w-full max-w-lg mx-auto space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: 'Saya ingin minuman yang segar dan ada rasa buahnya, tapi bukan kopi.'"
                    className="w-full h-28 p-3 bg-stone-700/50 border-2 border-stone-600 rounded-lg text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-colors"
                    aria-label="Describe your craving"
                    disabled={isLoading}
                />
                <button
                    onClick={getRecommendation}
                    disabled={isLoading}
                    className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                
                {error && <p className="text-red-400 text-center">{error}</p>}
                
                {recommendation && (
                    <div className="mt-6 bg-stone-900/50 p-4 rounded-lg border border-stone-700 animate-fade-in-content">
                        <h3 className="font-semibold text-white mb-2 flex items-center">
                            <i className="bi bi-robot mr-2 text-sky-400"></i>
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