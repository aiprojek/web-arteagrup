import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import LinkButton from './LinkButton';
import Footer from './Footer';
import { LinkItem, LayoutItem } from '../types';
import { Page } from '../App';
import DraggableItem from './DraggableItem';
import LayoutControlPanel from './LayoutControlPanel';

// Type definition for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

interface HomePageProps {
    onNavigate: (page: Page) => void;
    onShowQrCode: () => void;
    onShowDiscovery: () => void;
}

const defaultLayouts: Record<string, LayoutItem[]> = {
    standard: [
        { id: 'artea-btn', x: 0, y: 0, width: 100, height: 52, minWidth: 80, minHeight: 40 },
        { id: 'janji-koffee-btn', x: 0, y: 60, width: 100, height: 52, minWidth: 80, minHeight: 40 },
        { id: 'discovery-btn', x: 0, y: 120, width: 100, height: 52, minWidth: 80, minHeight: 40 },
        { id: 'info-header', x: 0, y: 188, width: 100, height: 28, minWidth: 80, minHeight: 20 },
        { id: 'email-btn', x: 0, y: 224, width: 100, height: 52, minWidth: 80, minHeight: 40 },
        { id: 'whatsapp-btn', x: 0, y: 284, width: 100, height: 52, minWidth: 80, minHeight: 40 },
        { id: 'about-btn', x: 0, y: 344, width: 100, height: 52, minWidth: 80, minHeight: 40 },
    ],
    compact: [
        { id: 'artea-btn', x: 0, y: 0, width: 48, height: 52 },
        { id: 'janji-koffee-btn', x: 52, y: 0, width: 48, height: 52 },
        { id: 'discovery-btn', x: 0, y: 60, width: 100, height: 52 },
        { id: 'info-header', x: 0, y: 128, width: 100, height: 28 },
        { id: 'email-btn', x: 0, y: 164, width: 48, height: 52 },
        { id: 'whatsapp-btn', x: 52, y: 164, width: 48, height: 52 },
        { id: 'about-btn', x: 0, y: 224, width: 100, height: 52 },
    ]
};


const HomePage: React.FC<HomePageProps> = ({ onNavigate, onShowQrCode, onShowDiscovery }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [layout, setLayout] = useState<LayoutItem[]>(defaultLayouts.standard);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const storedLayout = localStorage.getItem('artea-custom-layout');
            if (storedLayout) {
                setLayout(JSON.parse(storedLayout));
            } else {
                setLayout(defaultLayouts.standard);
            }
        } catch (e) {
            console.error("Failed to load layout from localStorage", e);
            setLayout(defaultLayouts.standard);
        }
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e as BeforeInstallPromptEvent);
        };
        const handleAppInstalled = () => setInstallPromptEvent(null);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setIsActionMenuOpen(false);
            }
        };
        if (isActionMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isActionMenuOpen]);

    const handleInstallClick = () => {
        installPromptEvent?.prompt();
        setIsActionMenuOpen(false);
    };

    const handleShareOrCopy = async () => {
        const shareData = { title: 'Artea Grup', text: "Freshly Brewed, Daily.", url: window.location.href };
        if (navigator.share) {
            await navigator.share(shareData).catch(err => console.error("Share failed:", err));
            setIsActionMenuOpen(false);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
                setIsActionMenuOpen(false);
            }, 2000);
        }
    };
    
    const handleLayoutUpdate = useCallback((id: string, newLayout: Partial<LayoutItem>) => {
        setLayout(currentLayout =>
            currentLayout.map(item => item.id === id ? { ...item, ...newLayout } : item)
        );
    }, []);

    const handleSaveLayout = () => {
        localStorage.setItem('artea-custom-layout', JSON.stringify(layout));
        setIsLayoutEditMode(false);
    };
    
    const handleMenuAction = (action: () => void) => {
        action();
        setIsActionMenuOpen(false);
    };

    const handleResetLayout = () => setLayout(defaultLayouts.standard);
    
    const handleSetPresetLayout = (preset: 'standard' | 'compact') => setLayout(defaultLayouts[preset]);

    const infoLinks: LinkItem[] = [
        { id: 3, url: 'mailto:arteagrup@gmail.com', title: 'Email', icon: 'bi bi-envelope-fill' },
        { id: 4, url: 'https://wa.me/6281225879494?text=Bismillah', title: 'Whatsapp', icon: 'bi bi-whatsapp' },
    ];
    
    const layoutComponentMap: Record<string, React.ReactNode> = {
        'artea-btn': <button onClick={() => onNavigate('artea')} aria-label="Buka informasi Artea" className="group flex items-center justify-center w-full h-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out text-sm"><i className="bi bi-cup-straw mr-3 text-xl" aria-hidden="true"></i><span className="whitespace-nowrap">Artea</span></button>,
        'janji-koffee-btn': <button onClick={() => onNavigate('janji-koffee')} aria-label="Buka informasi Janji Koffee" className="group flex items-center justify-center w-full h-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out text-sm"><i className="bi bi-cup-hot-fill mr-3 text-xl" aria-hidden="true"></i><span className="whitespace-nowrap">Janji Koffee</span></button>,
        'discovery-btn': <button onClick={onShowDiscovery} aria-label="Temukan Minuman Ideal" className="group w-full h-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out text-sm"><div className="flex items-center justify-center"><i className="bi bi-stars mr-3 text-xl"></i><span className="whitespace-nowrap">Temukan Minuman Ideal</span></div></button>,
        'info-header': <h3 className="text-center text-stone-300 text-sm font-semibold tracking-wider uppercase w-full h-full flex items-center justify-center">Informasi</h3>,
        'email-btn': <LinkButton link={infoLinks[0]} />,
        'whatsapp-btn': <LinkButton link={infoLinks[1]} />,
        'about-btn': <button onClick={() => onNavigate('about')} aria-label="Buka tentang kami" className="group flex items-center justify-center w-full h-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out text-sm"><i className="bi bi-info-circle-fill mr-3 text-xl" aria-hidden="true"></i><span className="whitespace-nowrap">Tentang Kami</span></button>,
    };

    return (
        <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
            <div className={`relative w-full bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 ${isLayoutEditMode ? 'ring-2 ring-[var(--accent-color)] ring-offset-4 ring-offset-black/50' : ''}`}>
                
                <div ref={actionMenuRef} className="absolute top-4 right-4 z-20">
                    <button 
                        onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} 
                        aria-label="Buka menu aksi"
                        aria-haspopup="true"
                        aria-expanded={isActionMenuOpen}
                        className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                    </button>
                    {isActionMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-stone-800/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-down">
                            <ul className="text-white text-sm" role="menu">
                                <li role="menuitem">
                                    <button onClick={() => handleMenuAction(() => setIsLayoutEditMode(!isLayoutEditMode))} className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors">
                                        <i className="bi bi-grid-3x3-gap-fill w-8 text-center text-base"></i>
                                        <span>Tata Letak</span>
                                    </button>
                                </li>
                                <li role="menuitem">
                                    <button onClick={() => handleMenuAction(() => onNavigate('themes'))} className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors">
                                        <i className="bi bi-palette-fill w-8 text-center text-base"></i>
                                        <span>Tampilan</span>
                                    </button>
                                </li>
                                <li role="menuitem">
                                    <button onClick={() => handleMenuAction(onShowQrCode)} className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors">
                                        <i className="bi bi-qr-code-scan w-8 text-center text-base"></i>
                                        <span>Kode QR</span>
                                    </button>
                                </li>
                                {installPromptEvent && (
                                <li role="menuitem">
                                    <button onClick={handleInstallClick} className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors">
                                        <i className="bi bi-box-arrow-in-down w-8 text-center text-base"></i>
                                        <span>Instal Aplikasi</span>
                                    </button>
                                </li>
                                )}
                                <li role="menuitem">
                                    <button onClick={handleShareOrCopy} className="w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors">
                                        {isCopied ? <i className="bi bi-check-lg w-8 text-center text-base text-green-400"></i> : <i className="bi bi-share-fill w-8 text-center text-base"></i>}
                                        <span>{isCopied ? 'Tautan Disalin!' : 'Bagikan'}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <Header />
                <div className="mt-8 w-full">
                    <div className="relative h-[440px]">
                        {layout.map((item) => (
                            <DraggableItem
                                key={item.id}
                                {...item}
                                isEditing={isLayoutEditMode}
                                onUpdate={handleLayoutUpdate}
                            >
                                {layoutComponentMap[item.id]}
                            </DraggableItem>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />

            <LayoutControlPanel 
                isOpen={isLayoutEditMode}
                onSetPreset={handleSetPresetLayout}
                onReset={handleResetLayout}
                onSave={handleSaveLayout}
            />
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                    transform-origin: top right;
                }
            `}</style>
        </main>
    );
};

export default HomePage;