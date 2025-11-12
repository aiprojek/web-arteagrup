import React, { useState } from 'react';

type Outlet = 'artea' | 'janji-koffee' | 'semua';
type QuestionKey = string;
type AnswerKey = string;

interface QuizOption {
    text: string;
    value: AnswerKey;
    icon: string;
}

interface QuizQuestion {
    text: string;
    options: QuizOption[];
}

interface QuizResult {
    drink: string;
    brand: 'Artea' | 'Janji Koffee' | 'Artea / Janji Koffee';
    description: string;
    icon: string;
}

// --- KUIS DATA BARU ---

const questions: Record<QuestionKey, QuizQuestion> = {
    // Artea Questions
    artea_start: {
        text: 'Kamu lagi butuh yang gimana?',
        options: [
            { text: 'Segar & Haus', value: 'segar', icon: 'bi-wind' },
            { text: 'Manis & Creamy', value: 'creamy', icon: 'bi-cloud-moon-fill' },
            { text: 'Butuh Kopi', value: 'kopi', icon: 'bi-cup-hot-fill' },
        ],
    },
    artea_segar_type: {
        text: 'Segarnya mau yang kayak gimana?',
        options: [
            { text: 'Klasik Rasa Teh', value: 'teh_klasik', icon: 'bi-bookmark-star-fill' },
            { text: 'Ada Rasa Buahnya', value: 'buah', icon: 'bi-apple' },
            { text: 'Pakai Soda Biar Nampol!', value: 'soda', icon: 'bi-stars' },
        ],
    },
    artea_creamy_type: {
        text: 'Pilih rasa favoritmu:',
        options: [
            { text: 'Yang Unik Kayak Taro', value: 'unik', icon: 'bi-magic' },
            { text: 'Matcha yang Menenangkan', value: 'matcha', icon: 'bi-flower1' },
            { text: 'Manisnya Milk Tea Klasik', value: 'susu_teh', icon: 'bi-cup-straw' },
        ],
    },
    artea_kopi_type: {
        text: 'Kopi yang gimana?',
        options: [
            { text: 'Pahit Klasik', value: 'pahit', icon: 'bi-cup-fill' },
            { text: 'Kekinian Gula Aren', value: 'kekinian', icon: 'bi-box-seam' },
        ],
    },
    // Janji Koffee Questions
    'janji-koffee_start': {
        text: 'Hari ini tim Kopi atau Non-Kopi?',
        options: [
            { text: 'Tim Kopi Pastinya!', value: 'kopi', icon: 'bi-cup-hot-fill' },
            { text: 'Lagi Pengen Non-Kopi', value: 'non_kopi', icon: 'bi-cup-straw' },
        ],
    },
    'janji-koffee_kopi_type': {
        text: 'Suka kopi yang gimana?',
        options: [
            { text: 'Hitam Tanpa Gula', value: 'hitam', icon: 'bi-cup-fill' },
            { text: 'Manis & Creamy', value: 'manis_creamy', icon: 'bi-cup-hot' },
            { text: 'Unik & Beda', value: 'unik', icon: 'bi-magic' },
        ],
    },
    'janji-koffee_non_kopi_type': {
        text: 'Pilih seleramu:',
        options: [
            { text: 'Segar Meledak', value: 'segar_soda', icon: 'bi-wind' },
            { text: 'Coklat Banget', value: 'coklat', icon: 'bi-box-seam' },
            { text: 'Tenang Kayak Matcha', value: 'matcha', icon: 'bi-flower1' },
        ],
    },
    // Semua Outlet Questions
    semua_start: {
        text: 'Kopi atau Non-Kopi?',
        options: [
            { text: 'Kopi', value: 'kopi', icon: 'bi-cup-hot-fill' },
            { text: 'Non-Kopi', value: 'non_kopi', icon: 'bi-cup-straw' },
        ],
    },
    semua_kopi_type: {
        text: 'Seleranya gimana?',
        options: [
            { text: 'Pahit & Kuat', value: 'pahit', icon: 'bi-cup-fill' },
            { text: 'Manis Legit Kekinian', value: 'manis', icon: 'bi-box-seam' },
        ],
    },
    semua_non_kopi_type: {
        text: 'Seleranya gimana?',
        options: [
            { text: 'Segar Rasa Buah', value: 'segar_buah', icon: 'bi-apple' },
            { text: 'Manis & Creamy', value: 'manis_creamy', icon: 'bi-cloud-moon-fill' },
        ],
    },
};

const quizFlow: Record<Outlet, Record<QuestionKey, Record<AnswerKey, QuestionKey | QuizResult>>> = {
    artea: {
        start: { segar: 'artea_segar_type', creamy: 'artea_creamy_type', kopi: 'artea_kopi_type' },
        artea_segar_type: {
            teh_klasik: { drink: 'Teh Lemon', brand: 'Artea', description: 'Kesegaran klasik dari teh pilihan dan perasan lemon asli. Pilihan anti-gagal buat balikin mood!', icon: 'bi-leaf' },
            buah: { drink: 'Teh Leci', brand: 'Artea', description: 'Manisnya leci berpadu dengan teh pilihan, menyegarkan tanpa berlebihan.', icon: 'bi-apple' },
            soda: { drink: 'Mojito Strawberry', brand: 'Artea', description: 'Ledakan kesegaran strawberry dan soda yang dijamin bikin harimu ceria lagi!', icon: 'bi-stars' }
        },
        artea_creamy_type: {
            unik: { drink: 'Taro', brand: 'Artea', description: 'Rasa taro yang unik dan creamy, pilihan pas untuk memanjakan diri.', icon: 'bi-cup-straw' },
            matcha: { drink: 'Matcha', brand: 'Artea', description: 'Nikmati ketenangan dengan rasa matcha premium yang khas dan lembut.', icon: 'bi-flower1' },
            susu_teh: { drink: 'Milk Tea', brand: 'Artea', description: 'Minuman klasik yang selalu jadi favorit. Manisnya pas, segarnya dapat!', icon: 'bi-cup-straw' },
        },
        artea_kopi_type: {
            pahit: { drink: 'Americano', brand: 'Artea', description: 'Kopi hitam murni yang strong, pilihan tepat untuk dorongan semangat tanpa gula.', icon: 'bi-cup-fill' },
            kekinian: { drink: 'Brown Sugar Coffee', brand: 'Artea', description: 'Rasa kopi kekinian dengan manis legit dari gula aren yang khas dan menggoda.', icon: 'bi-box-seam' },
        }
    },
    'janji-koffee': {
        start: { kopi: 'janji-koffee_kopi_type', non_kopi: 'janji-koffee_non_kopi_type' },
        'janji-koffee_kopi_type': {
            hitam: { drink: 'Americano', brand: 'Janji Koffee', description: 'Pilihan klasik tanpa basa-basi untuk memulai hari dengan semangat dan fokus penuh!', icon: 'bi-cup-fill' },
            manis_creamy: { drink: 'Spanish Latte', brand: 'Janji Koffee', description: 'Perpaduan kopi dan susu manis yang lembut, pas untuk menemanimu kapan saja.', icon: 'bi-cup-hot' },
            unik: { drink: 'Butterscotch', brand: 'Janji Koffee', description: 'Kopi dengan sirup butterscotch yang punya rasa manis karamel dan sentuhan butter. Unik!', icon: 'bi-magic' },
        },
        'janji-koffee_non_kopi_type': {
            segar_soda: { drink: 'Lemon Squash', brand: 'Janji Koffee', description: 'Kesegaran maksimal dari lemon dan soda. Pilihan non-kopi yang super nyegerin!', icon: 'bi-wind' },
            coklat: { drink: 'Choco Malt', brand: 'Janji Koffee', description: 'Minuman coklat klasik dengan tambahan malt yang memberikan rasa gurih dan khas.', icon: 'bi-box-seam' },
            matcha: { drink: 'Creamy Matcha', brand: 'Janji Koffee', description: 'Nikmati ketenangan dengan rasa matcha premium yang khas dan lembut dalam balutan susu.', icon: 'bi-flower1' },
        },
    },
    semua: {
        start: { kopi: 'semua_kopi_type', non_kopi: 'semua_non_kopi_type' },
        semua_kopi_type: {
            pahit: { drink: 'Americano', brand: 'Artea / Janji Koffee', description: 'Pilihan klasik tanpa basa-basi untuk memulai hari dengan semangat dan fokus penuh!', icon: 'bi-cup-hot-fill' },
            manis: { drink: 'Brown Sugar Coffee', brand: 'Artea / Janji Koffee', description: 'Rasa kopi kekinian dengan manis legit dari gula aren yang khas dan menggoda.', icon: 'bi-box-seam' },
        },
        semua_non_kopi_type: {
            segar_buah: { drink: 'Teh Leci', brand: 'Artea', description: 'Manisnya leci berpadu dengan teh pilihan, menyegarkan tanpa berlebihan.', icon: 'bi-apple' },
            manis_creamy: { drink: 'Taro', brand: 'Artea', description: 'Rasa taro yang unik dan creamy, pilihan pas untuk memanjakan diri.', icon: 'bi-cloud-moon-fill' },
        },
    }
};


// Main Component
const MenuQuiz: React.FC = () => {
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [currentQuestionKey, setCurrentQuestionKey] = useState<QuestionKey | null>(null);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [isFadingOut, setIsFadingOut] = useState(false);
    
    const outletDetails: Record<Outlet, { name: string; icon: string }> = {
        artea: { name: 'Artea', icon: 'bi-cup-straw' },
        'janji-koffee': { name: 'Janji Koffee', icon: 'bi-cup-hot-fill' },
        semua: { name: 'Semua Outlet', icon: 'bi-shop' },
    };

    const handleSelectOutlet = (outlet: Outlet) => {
        setIsFadingOut(true);
        setTimeout(() => {
            setSelectedOutlet(outlet);
            setCurrentQuestionKey('start');
            setIsFadingOut(false);
        }, 300);
    }

    const handleAnswer = (answerValue: AnswerKey) => {
        if (!selectedOutlet || !currentQuestionKey) return;
        
        setIsFadingOut(true);
        setTimeout(() => {
            const nextStep = quizFlow[selectedOutlet][currentQuestionKey][answerValue];
            if (typeof nextStep === 'string') {
                setCurrentQuestionKey(nextStep);
            } else {
                setResult(nextStep);
            }
            setIsFadingOut(false);
        }, 300);
    };
    
    const resetQuiz = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setCurrentQuestionKey('start');
            setResult(null);
            setIsFadingOut(false);
        }, 300);
    };

    const handleOutletChange = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setSelectedOutlet(null);
            setCurrentQuestionKey(null);
            setResult(null);
            setIsFadingOut(false);
        }, 300);
    };

    const currentQuestion = selectedOutlet && currentQuestionKey ? questions[`${selectedOutlet}_${currentQuestionKey}`] || questions[currentQuestionKey] : null;
    const isFirstQuestion = currentQuestionKey === 'start';
    const progress = result ? 100 : (isFirstQuestion ? 0 : 50);

    return (
        <div className="flex flex-col h-full text-center">
            {!selectedOutlet ? (
                 <div className={`transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100 animate-fade-in-content'} space-y-4`}>
                    <h2 className="text-2xl font-bold text-white mb-2">Kuis Menu Ideal</h2>
                    <p className="text-stone-400 mb-6">Pilih dulu outletnya untuk menemukan menu yang pas buatmu!</p>
                    <button 
                        onClick={() => handleSelectOutlet('artea')}
                        className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="bi bi-cup-straw text-3xl mb-2 text-green-400"></i>
                        <span className="font-bold">Artea</span>
                        <span className="text-xs text-stone-400">Teh, Kopi, Creamy, & Mojito</span>
                    </button>
                    <button 
                        onClick={() => handleSelectOutlet('janji-koffee')}
                        className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="bi bi-cup-hot-fill text-3xl mb-2 text-amber-400"></i>
                        <span className="font-bold">Janji Koffee</span>
                        <span className="text-xs text-stone-400">Spesialis Kopi & Minuman Non-Kopi</span>
                    </button>
                    <button 
                        onClick={() => handleSelectOutlet('semua')}
                        className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="bi bi-shop text-3xl mb-2 text-sky-400"></i>
                        <span className="font-bold">Semua Outlet</span>
                        <span className="text-xs text-stone-400">Lihat semua kemungkinan</span>
                    </button>
                </div>
            ) : !result ? (
                <>
                    <h2 className="text-2xl font-bold text-white mb-2">Kuis Menu Ideal</h2>
                    <p className="text-stone-400 mb-6">Jawab 2 pertanyaan untuk menemukan jodoh menumu!</p>
                    
                     <div className="bg-stone-900/50 p-2 rounded-lg border border-stone-700 text-xs mb-4 flex justify-between items-center max-w-xs mx-auto w-full">
                        <div className="flex items-center">
                            <i className={`${outletDetails[selectedOutlet].icon} mr-2 text-[var(--accent-color)]`}></i>
                            <span className="text-stone-300">Outlet: <strong className="text-white">{outletDetails[selectedOutlet].name}</strong></span>
                        </div>
                        <button onClick={handleOutletChange} className="font-semibold text-[var(--accent-color)] hover:opacity-80">Ganti</button>
                    </div>

                    <div className="w-full bg-stone-700 rounded-full h-2.5 mb-6">
                        <div className="bg-[var(--accent-color)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    {currentQuestion && (
                        <div className={`transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                            <h3 className="text-xl font-semibold text-white mb-6 min-h-[56px] flex items-center justify-center">
                                {currentQuestion.text}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className="group flex items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                    >
                                        <i className={`${option.icon} mr-3 text-2xl text-[var(--accent-color)] transition-transform duration-300 group-hover:rotate-[-12deg]`}></i>
                                        <span>{option.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className={`flex flex-col items-center justify-center h-full transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100 animate-fade-in-content'}`}>
                    <p className="text-stone-300 mb-2">Rekomendasi terbaik untukmu adalah...</p>
                    <div className="w-24 h-24 mb-4 rounded-full bg-[var(--accent-color)]/20 border-2 border-[var(--accent-color)] flex items-center justify-center text-[var(--accent-color)] text-5xl">
                         <i className={result.icon}></i>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{result.drink}</h3>
                    <p className="text-sm font-semibold text-stone-400 mb-4">dari {result.brand}</p>
                    <p className="text-stone-300 max-w-sm mb-8">
                        "{result.description}"
                    </p>

                    <button
                        onClick={resetQuiz}
                        className="w-full max-w-xs bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                    >
                         <i className="bi bi-arrow-clockwise mr-2"></i>
                         Coba Kuis Lagi
                    </button>
                     <button onClick={handleOutletChange} className="mt-4 text-sm font-semibold text-[var(--accent-color)] hover:opacity-80">
                        Pilih Outlet Lain
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

export default MenuQuiz;