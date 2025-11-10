
import React, { useState } from 'react';

// Define types for quiz
type AnswerValue = 'semangat' | 'santai' | 'haus' | 'creamy' | 'buah' | 'kopi' | 'pagi' | 'siang' | 'sore';

interface AnswerOption {
    text: string;
    value: AnswerValue;
    icon: string;
}

interface Question {
    key: 'mood' | 'rasa' | 'waktu';
    text: string;
    options: AnswerOption[];
}

interface Result {
    drink: string;
    brand: 'Artea' | 'Janji Koffee';
    description: string;
    icon: string;
}

// Quiz data
const quizQuestions: Question[] = [
    {
        key: 'mood',
        text: 'Bagaimana mood-mu hari ini?',
        options: [
            { text: 'Butuh Semangat', value: 'semangat', icon: 'bi-lightning-charge-fill' },
            { text: 'Ingin Santai', value: 'santai', icon: 'bi-moon-stars-fill' },
            { text: 'Lagi Haus Banget', value: 'haus', icon: 'bi-droplet-fill' },
        ],
    },
    {
        key: 'rasa',
        text: 'Rasa apa yang kamu cari?',
        options: [
            { text: 'Manis & Creamy', value: 'creamy', icon: 'bi-cup-straw' },
            { text: 'Segar & Buah', value: 'buah', icon: 'bi-apple' },
            { text: 'Kopi Banget', value: 'kopi', icon: 'bi-cup-hot-fill' },
        ],
    },
    {
        key: 'waktu',
        text: 'Kapan rencananya mau minum?',
        options: [
            { text: 'Pagi Hari', value: 'pagi', icon: 'bi-sunrise-fill' },
            { text: 'Siang Terik', value: 'siang', icon: 'bi-sun-fill' },
            { text: 'Sore Santai', value: 'sore', icon: 'bi-sunset-fill' },
        ],
    },
];

// Main Component
const DrinkQuiz: React.FC = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Partial<Record<Question['key'], AnswerValue>>>({});
    const [result, setResult] = useState<Result | null>(null);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const handleAnswer = (key: Question['key'], value: AnswerValue) => {
        setIsFadingOut(true);
        setTimeout(() => {
            const newAnswers = { ...answers, [key]: value };
            setAnswers(newAnswers);

            if (currentQuestionIndex < quizQuestions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                calculateResult(newAnswers);
            }
            setIsFadingOut(false);
        }, 300); // Match fade-out duration
    };
    
    const calculateResult = (finalAnswers: typeof answers) => {
        const { mood, rasa, waktu } = finalAnswers;
        let recommendation: Result;

        // Logic tree for recommendations
        if (rasa === 'kopi') {
            if (mood === 'semangat' || waktu === 'pagi') {
                recommendation = { drink: 'Americano', brand: 'Janji Koffee', description: 'Pilihan klasik untuk memulai hari dengan semangat dan fokus penuh!', icon: 'bi-cup-hot-fill' };
            } else {
                recommendation = { drink: 'Spanish Latte', brand: 'Janji Koffee', description: 'Perpaduan kopi dan susu manis yang lembut, pas untuk menemanimu kapan saja.', icon: 'bi-cup-hot' };
            }
        } else if (rasa === 'buah') {
            if (mood === 'haus' || waktu === 'siang') {
                recommendation = { drink: 'Mojito Strawberry', brand: 'Artea', description: 'Ledakan kesegaran strawberry dan soda yang dijamin bikin harimu ceria lagi!', icon: 'bi-stars' };
            } else {
                recommendation = { drink: 'Teh Leci', brand: 'Artea', description: 'Manisnya leci berpadu dengan teh pilihan, menyegarkan tanpa berlebihan.', icon: 'bi-leaf' };
            }
        } else if (rasa === 'creamy') {
             if (mood === 'santai' || waktu === 'sore') {
                recommendation = { drink: 'Matcha', brand: 'Artea', description: 'Nikmati ketenangan sore dengan rasa matcha premium yang khas dan lembut.', icon: 'bi-cup-straw' };
            } else {
                 recommendation = { drink: 'Taro', brand: 'Artea', description: 'Rasa taro yang unik dan creamy, pilihan pas untuk memanjakan diri.', icon: 'bi-cup-straw' };
            }
        } else {
            // Default fallback
            recommendation = { drink: 'Milk Tea', brand: 'Artea', description: 'Minuman klasik yang selalu jadi favorit. Manisnya pas, segarnya dapat!', icon: 'bi-cup-straw' };
        }
        setResult(recommendation);
    };
    
    const resetQuiz = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setAnswers({});
            setCurrentQuestionIndex(0);
            setResult(null);
            setIsFadingOut(false);
        }, 300);
    };

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="flex flex-col h-full text-center">
            {!result ? (
                <>
                    <h2 className="text-2xl font-bold text-white mb-2">Kuis Minuman Ideal</h2>
                    <p className="text-stone-400 mb-8">Jawab 3 pertanyaan singkat untuk menemukan jodoh minumanmu!</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-700 rounded-full h-2.5 mb-6">
                        <div className="bg-sky-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className={`transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                        <h3 className="text-xl font-semibold text-white mb-6 min-h-[56px] flex items-center justify-center">
                            {currentQuestion.text}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleAnswer(currentQuestion.key, option.value)}
                                    className="group flex items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className={`${option.icon} mr-3 text-2xl text-sky-400 transition-transform duration-300 group-hover:rotate-[-12deg]`}></i>
                                    <span>{option.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className={`flex flex-col items-center justify-center h-full transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100 animate-fade-in-content'}`}>
                    <p className="text-stone-300 mb-2">Rekomendasi terbaik untukmu adalah...</p>
                    <div className="w-24 h-24 mb-4 rounded-full bg-sky-400/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 text-5xl">
                         <i className={result.icon}></i>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{result.drink}</h3>
                    <p className="text-sm font-semibold text-stone-400 mb-4">dari {result.brand}</p>
                    <p className="text-stone-300 max-w-sm mb-8">
                        "{result.description}"
                    </p>

                    <button
                        onClick={resetQuiz}
                        className="w-full max-w-xs bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                    >
                         <i className="bi bi-arrow-clockwise mr-2"></i>
                         Coba Kuis Lagi
                    </button>
                </div>
            )}
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

export default DrinkQuiz;
