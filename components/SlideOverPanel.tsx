
import React, { useEffect } from 'react';

interface SlideOverPanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const SlideOverPanel: React.FC<SlideOverPanelProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleResize = () => {
            if (window.innerWidth >= 768 && document.body.style.overflow === 'hidden') {
                 document.body.style.overflow = 'unset';
            } else if (window.innerWidth < 768 && isOpen) {
                document.body.style.overflow = 'hidden';
            }
        }
        
        if (isOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Overlay for mobile view only */}
            <div 
                className={`
                    fixed inset-0 bg-black/60 backdrop-blur-sm z-40
                    transition-opacity duration-300
                    md:hidden 
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Panel */}
            <aside 
                className={`
                    fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-stone-800 text-stone-200 
                    shadow-[-10px_0px_20px_-10px_rgba(0,0,0,0.5)] z-50
                    transform transition-transform duration-500 ease-in-out 
                    flex flex-col 
                    sm:w-[40rem] sm:max-w-none
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                role="dialog"
                aria-modal="true"
                aria-hidden={!isOpen}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-end p-2 sticky top-0 bg-stone-800/80 backdrop-blur-sm z-10 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white transition-colors p-2 rounded-full"
                        aria-label="Close panel"
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </header>
                <div className="overflow-y-auto px-6 md:px-8 pb-8 -mt-12 pt-12 flex-grow">
                    {children}
                </div>
            </aside>
        </>
    );
};

export default SlideOverPanel;