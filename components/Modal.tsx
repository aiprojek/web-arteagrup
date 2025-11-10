import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-500 ease-in-out animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-screen h-screen bg-stone-900 text-stone-200 flex flex-col transform transition-all duration-500 ease-in-out opacity-0 animate-fade-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-end p-4 flex-shrink-0 absolute top-0 right-0 z-20">
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white bg-stone-800/50 hover:bg-stone-700/80 transition-all duration-300 w-12 h-12 rounded-full flex items-center justify-center"
                        aria-label="Close modal"
                    >
                        <i className="bi bi-x-lg text-2xl"></i>
                    </button>
                </header>
                <div className="overflow-y-auto flex-grow">
                    <div className="w-full max-w-4xl mx-auto px-6 md:px-8 pt-20 pb-12">
                        {children}
                    </div>
                </div>
                <footer className="flex-shrink-0 p-4 text-center text-xs text-stone-500 border-t border-stone-700/50">
                    © {new Date().getFullYear()} Artea Grup. Web by{' '}
                    <a 
                        href="https://aiprojek01.my.id" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-sky-400 transition-colors"
                    >
                        AI Projek
                    </a>.
                </footer>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-in-out forwards;
                }
                @keyframes fade-slide-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-slide-in {
                    animation: fade-slide-in 0.5s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Modal;