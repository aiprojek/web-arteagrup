
import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ArteaPage from './components/ArteaPage';
import JanjiKoffeePage from './components/JanjiKoffeePage';
import AboutPage from './components/AboutPage';
import SlideOverPanel from './components/SlideOverPanel';
import Modal from './components/Modal';
import DrinkRecommender from './components/DrinkRecommender';
import { useMediaQuery } from './hooks/useMediaQuery';

export type Page = 'artea' | 'janji-koffee' | 'about' | 'recommender';

const App: React.FC = () => {
    const [activePanel, setActivePanel] = useState<Page | null>(null);
    const isDesktop = useMediaQuery('(min-width: 768px)');

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
            default:
                return null;
        }
    };

    const handleClose = () => {
        setActivePanel(null);
    }

    return (
        <div className="relative min-h-screen text-white overflow-x-hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            {/* Main Content Area */}
            <main className="min-h-screen w-full flex items-center justify-center p-4">
                <HomePage onNavigate={setActivePanel} />
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
        </div>
    );
};

export default App;