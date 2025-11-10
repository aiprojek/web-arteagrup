import React from 'react';
import { Theme } from '../types';

interface ThemesPanelProps {
    currentTheme: Theme;
    onThemeSelect: (theme: Theme) => void;
}

export const themes: Theme[] = [
    { 
        id: 'default', 
        name: 'Biru Artea', 
        backgroundImage: 'https://picsum.photos/seed/artea/1920/1080',
        accentColor: '#38bdf8', // sky-400
        accentColorHover: '#0ea5e9' // sky-500
    },
    { 
        id: 'forest', 
        name: 'Hutan Tenang', 
        backgroundImage: 'https://picsum.photos/seed/forest/1920/1080',
        accentColor: '#4ade80', // green-400
        accentColorHover: '#22c55e' // green-500
    },
    { 
        id: 'coffee', 
        name: 'Warm Coffee', 
        backgroundImage: 'https://picsum.photos/seed/coffee/1920/1080',
        accentColor: '#f59e0b', // amber-500
        accentColorHover: '#d97706' // amber-600
    },
    { 
        id: 'dusk', 
        name: 'Senja Ungu', 
        backgroundImage: 'https://picsum.photos/seed/dusk/1920/1080',
        accentColor: '#c084fc', // purple-400
        accentColorHover: '#a855f7' // purple-500
    },
     { 
        id: 'sunset', 
        name: 'Matahari Terbenam', 
        backgroundImage: 'https://picsum.photos/seed/sunset/1920/1080',
        accentColor: '#fb923c', // orange-400
        accentColorHover: '#f97316' // orange-500
    },
    { 
        id: 'mono', 
        name: 'Hitam Putih', 
        backgroundImage: 'https://picsum.photos/seed/mono/1920/1080?grayscale',
        accentColor: '#a1a1aa', // stone-400
        accentColorHover: '#71717a' // stone-500
    },
];

const ThemesPanel: React.FC<ThemesPanelProps> = ({ currentTheme, onThemeSelect }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Pilih Tampilan</h2>
                <p className="text-stone-400 mb-8">Personalisasikan pengalaman Anda dengan memilih tema yang paling Anda sukai.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themes.map((theme) => {
                    const isActive = currentTheme.id === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => onThemeSelect(theme)}
                            className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-300 transform focus:outline-none ${isActive ? 'border-[var(--accent-color)] scale-105 shadow-2xl' : 'border-transparent hover:scale-105'}`}
                            aria-label={`Select ${theme.name} theme`}
                            aria-pressed={isActive}
                        >
                            <img 
                                src={`${theme.backgroundImage}&blur=2`}
                                alt={`${theme.name} theme preview`}
                                className="w-full h-32 object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-semibold text-sm">{theme.name}</span>
                                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
                                </div>
                            </div>

                             {isActive && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--accent-color)] rounded-full flex items-center justify-center text-black">
                                    <i className="bi bi-check-lg font-bold"></i>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ThemesPanel;
