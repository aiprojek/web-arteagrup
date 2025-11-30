import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import ArteaPage from './components/ArteaPage';
import JanjiKoffeePage from './components/JanjiKoffeePage';
import AboutPage from './components/AboutPage';
import SlideOverPanel from './components/SlideOverPanel';
import Modal from './components/Modal';
import DrinkRecommender from './components/DrinkRecommender';
import { useMediaQuery } from './hooks/useMediaQuery';
import QRCodeModal from './components/QRCodeModal';
import ThemesPanel, { themes } from './components/ThemesPanel';
import { Theme } from './types';


export type Page = 'artea' | 'janji-koffee' | 'about' | 'recommender' | 'themes';

const App: React.FC = () => {
    const [activePanel, setActivePanel] = useState<Page | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
    const isDesktop = useMediaQuery('(min-width: 768px)');

     useEffect(() => {
        try {
            const storedThemeId = localStorage.getItem('artea-theme-id');
            const savedTheme = themes.find(t => t.id === storedThemeId) || themes[0];
            handleThemeChange(savedTheme);
        } catch (e) {
            console.error("Failed to load theme from localStorage", e);
            handleThemeChange(themes[0]);
        }
    }, []);

    const handleThemeChange = (theme: Theme) => {
        setCurrentTheme(theme);
        document.documentElement.style.setProperty('--accent-color', theme.accentColor);
        document.documentElement.style.setProperty('--accent-color-hover', theme.accentColorHover);
        localStorage.setItem('artea-theme-id', theme.id);
    };

    const handleNavigate = (page: Page) => {
        setActivePanel(page);
    }

    const renderPanelContent = () => {
        switch (activePanel) {
            case 'artea':
                return <ArteaPage />;
            case 'janji-koffee':
                return <JanjiKoffeePage />;
            case 'about':
                return <AboutPage />;
            case 'recommender':
                return <DrinkRecommender />;
            case 'themes':
                return <ThemesPanel 
                            currentTheme={currentTheme} 
                            onThemeSelect={handleThemeChange} 
                        />;
            default:
                return null;
        }
    };

    const handleClose = () => {
        setActivePanel(null);
    }

    return (
        <div 
             className="relative min-h-screen text-white overflow-x-hidden bg-cover bg-center bg-fixed transition-all duration-500 ease-in-out"
             style={{ backgroundImage: `url('${currentTheme.backgroundImage}')` }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            {/* Main Content Area */}
            <main className="min-h-screen w-full flex items-center justify-center p-4">
                <HomePage onNavigate={handleNavigate} onShowQrCode={() => setIsQrModalOpen(true)} />
            </main>

            {isDesktop ? (
                <Modal isOpen={!!activePanel} onClose={handleClose}>
                    {renderPanelContent()}
                </Modal>
            ) : (
                <SlideOverPanel isOpen={!!activePanel} onClose={handleClose}>
                    {renderPanelContent()}
                </SlideOverPanel>
            )}

            <QRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
        </div>
    );
};

export default App;