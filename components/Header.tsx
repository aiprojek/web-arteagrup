import React from 'react';
import ArteaLogoIcon from './icons/ArteaLogoIcon';

const Header: React.FC = () => {
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
            <p className="text-stone-200 mt-2 text-sm md:text-base">
                Freshly Brewed, Daily.
            </p>
        </header>
    );
};

export default Header;