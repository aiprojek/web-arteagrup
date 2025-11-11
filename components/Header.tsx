import React, { useState, useEffect } from 'react';
import ArteaLogoIcon from './icons/ArteaLogoIcon';

const Header: React.FC = () => {
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopIndex, setLoopIndex] = useState(0);

    // I've added a second phrase to make the animation more engaging, as you were open to suggestions!
    const phrases = ["Freshly Brewed, Daily.", "Your Daily Dose of Joy."];
    const typingSpeed = 150;
    const deletingSpeed = 75;
    const pauseDuration = 2000;

    useEffect(() => {
        const handleTyping = () => {
            const currentPhrase = phrases[loopIndex % phrases.length];
            
            if (isDeleting) {
                // Handle deleting
                if (displayedText.length > 0) {
                    setDisplayedText(current => current.substring(0, current.length - 1));
                } else {
                    // Finished deleting
                    setIsDeleting(false);
                    setLoopIndex(current => current + 1);
                }
            } else {
                // Handle typing
                if (displayedText.length < currentPhrase.length) {
                    setDisplayedText(current => currentPhrase.substring(0, current.length + 1));
                } else {
                    // Wait after typing is complete, then start deleting
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            }
        };

        const timeout = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

        // Cleanup timeout on component unmount or re-render
        return () => clearTimeout(timeout);

    }, [displayedText, isDeleting, loopIndex]);


    return (
        <header className="flex flex-col items-center text-center p-4">
            <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/50 shadow-xl mb-4 bg-stone-800/50 p-3 overflow-hidden flex items-center justify-center"
                aria-label="Artea Grup Logo"
            >
                 <ArteaLogoIcon className="w-full h-full text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">
                Artea Grup
            </h1>
            <p className="text-stone-200 mt-2 text-sm md:text-base min-h-[24px]">
                {displayedText}
                <span className="typing-cursor"></span>
            </p>
             <style>{`
                .typing-cursor {
                    border-left: 2px solid var(--accent-color);
                    animation: blink 0.75s step-end infinite;
                    margin-left: 4px;
                }
                @keyframes blink {
                    from, to { border-color: transparent }
                    50% { border-color: var(--accent-color); }
                }
            `}</style>
        </header>
    );
};

export default Header;