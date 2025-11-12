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
        backgroundImage: 'https://images.unsplash.com/photo-1554147090-e1221a04a025?w=1920&q=80&fit=max',
        accentColor: '#38bdf8', // sky-400
        accentColorHover: '#0ea5e9' // sky-500
    },
    { 
        id: 'forest', 
        name: 'Hutan Tenang', 
        backgroundImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&fit=max',
        accentColor: '#4ade80', // green-400
        accentColorHover: '#22c55e' // green-500
    },
    { 
        id: 'coffee', 
        name: 'Warm Coffee', 
        backgroundImage: 'https://cdn.pixabay.com/photo/2023/11/22/18/41/coffee-8406187_960_720.jpg',
        accentColor: '#f59e0b', // amber-500
        accentColorHover: '#d97706' // amber-600
    },
    { 
        id: 'dusk', 
        name: 'Senja Ungu', 
        backgroundImage: 'https://cdn.pixabay.com/photo/2017/08/10/03/12/purple-2617579_960_720.jpg',
        accentColor: '#c084fc', // purple-400
        accentColorHover: '#a855f7' // purple-500
    },
     { 
        id: 'sunset', 
        name: 'Matahari Terbenam', 
        backgroundImage: 'https://cdn.pixabay.com/photo/2016/11/29/04/19/ocean-1867285_1280.jpg',
        accentColor: '#fb923c', // orange-400
        accentColorHover: '#f97316' // orange-500
    },
    { 
        id: 'mono', 
        name: 'Hitam Putih', 
        backgroundImage: 'https://cdn.pixabay.com/photo/2023/04/11/00/58/desert-7915031_640.jpg',
        accentColor: '#a1a1aa', // stone-400
        accentColorHover: '#71717a' // stone-500
    },
];

const ThemesPanel: React.FC<ThemesPanelProps> = ({ currentTheme, onThemeSelect }) => {
    /**
     * Generates an optimized thumbnail URL from a full-size Unsplash URL.
     * It reduces the image dimensions for faster loading by modifying URL parameters.
     * @param fullUrl The original high-resolution image URL.
     * @returns A new URL for a smaller thumbnail.
     */
    const getThumbnailUrl = (fullUrl: string): string => {
        try {
            // Check if it's an Unsplash URL to apply optimizations
            if (fullUrl.includes('images.unsplash.com')) {
                const url = new URL(fullUrl);
                // Set a smaller width for the thumbnail and adjust quality for performance.
                url.searchParams.set('w', '400');
                url.searchParams.set('q', '75');
                return url.toString();
            }
            // For other URLs (like Pixabay), return as is, or you could implement specific logic.
            return fullUrl;
        } catch (e) {
            console.error("Failed to parse theme URL for thumbnail:", e);
            // Fallback to the original URL on any parsing error
            return fullUrl; 
        }
    };

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
                                src={getThumbnailUrl(theme.backgroundImage)}
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