import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import LinkButton from './LinkButton';
import Footer from './Footer';
import { LinkItem } from '../types';
import { Page } from '../App';

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
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, onShowQrCode }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);

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
    
    const handleMenuAction = (action: () => void) => {
        action();
        setIsActionMenuOpen(false);
    };

    const infoLinks: LinkItem[] = [
        { id: 3, url: 'mailto:arteagrup@gmail.com', title: 'Email', icon: 'bi bi-envelope-fill' },
        { id: 4, url: 'https://wa.me/6281225879494?text=Bismillah', title: 'Whatsapp', icon: 'bi bi-whatsapp' },
    ];
    
    return (
        <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
            <div className="relative w-full bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8">
                
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
                    <div className="flex flex-col space-y-4">
                       <button onClick={() => onNavigate('artea')} aria-label="Buka informasi Artea" className="group flex items-center justify-center w-full h-[52px] bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"><i className="bi bi-cup-straw mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i><span className="whitespace-nowrap">Artea</span></button>
                       <button onClick={() => onNavigate('janji-koffee')} aria-label="Buka informasi Janji Koffee" className="group flex items-center justify-center w-full h-[52px] bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"><i className="bi bi-cup-hot-fill mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i><span className="whitespace-nowrap">Janji Koffee</span></button>
                       
                       <button onClick={() => onNavigate('recommender')} aria-label="Tanya Asisten AI" className="group w-full h-[52px] bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"><div className="flex items-center justify-center"><i className="bi bi-chat-quote-fill mr-3 text-xl transition-transform duration-300 group-hover:rotate-12"></i><span className="whitespace-nowrap">Asisten AI Artea Grup</span></div></button>
                       <button onClick={() => onNavigate('quiz')} aria-label="Ikuti Kuis Menu" className="group flex items-center justify-center w-full h-[52px] bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"><i className="bi bi-patch-question-fill mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i><span className="whitespace-nowrap">Ikuti Kuis Menu</span></button>
                       
                        <div className="pt-4 pb-2">
                             <h3 className="text-center text-stone-300 text-sm font-semibold tracking-wider uppercase">Informasi</h3>
                        </div>

                       <LinkButton link={infoLinks[0]} />
                       <LinkButton link={infoLinks[1]} />

                       <button onClick={() => onNavigate('about')} aria-label="Buka tentang kami" className="group flex items-center justify-center w-full h-[52px] bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"><i className="bi bi-info-circle-fill mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i><span className="whitespace-nowrap">Tentang Kami</span></button>
                    </div>
                </div>
            </div>
            <Footer />

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