import React, { useEffect } from 'react';
import { Page } from '../App';

interface DiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: Page) => void;
}

const DiscoveryModal: React.FC<DiscoveryModalProps> = ({ isOpen, onClose, onNavigate }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-xs bg-stone-800 text-stone-200 rounded-2xl shadow-2xl p-6 flex flex-col items-center transform transition-all duration-300 ease-in-out opacity-0 animate-fade-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-stone-400 hover:text-white bg-stone-700/50 hover:bg-stone-700/80 transition-all duration-300 w-8 h-8 rounded-full flex items-center justify-center z-10"
                    aria-label="Tutup modal"
                >
                    <i className="bi bi-x-lg text-lg"></i>
                </button>
                
                <h3 className="text-xl font-bold text-white mb-6">Pilih Metode</h3>

                <div className="w-full space-y-4">
                    <button 
                        onClick={() => onNavigate('recommender')}
                        className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="bi bi-robot text-3xl mb-2 text-[var(--accent-color)]"></i>
                        <span className="font-bold">Rekomendasi AI</span>
                        <span className="text-xs text-stone-400">Dapatkan saran dari AI</span>
                    </button>
                     <button 
                        onClick={() => onNavigate('quiz')}
                        className="group flex flex-col items-center justify-center w-full bg-stone-700/50 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="bi bi-patch-question-fill text-3xl mb-2 text-[var(--accent-color)]"></i>
                        <span className="font-bold">Ikuti Kuis</span>
                         <span className="text-xs text-stone-400">Jawab pertanyaan singkat</span>
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-in-out forwards;
                }
                @keyframes fade-slide-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-slide-in {
                    animation: fade-slide-in 0.3s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DiscoveryModal;