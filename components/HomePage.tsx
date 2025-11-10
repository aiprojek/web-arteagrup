
import React, { useState } from 'react';
import Header from './Header';
import LinkButton from './LinkButton';
import Footer from './Footer';
import { LinkItem } from '../types';
import { Page } from '../App';

interface HomePageProps {
    onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const [isCopied, setIsCopied] = useState(false);

    const infoLinks: LinkItem[] = [
        { id: 3, url: 'mailto:arteagrup@gmail.com', title: 'Email', icon: 'bi bi-envelope-fill' },
        { id: 4, url: 'https://wa.me/6281225879494?text=Bismillah', title: 'Whatsapp', icon: 'bi bi-whatsapp' },
    ];

    const handleShareOrCopy = async () => {
        const shareData = {
            title: 'Artea Grup',
            text: "Freshly Brewed, Daily. Temukan semua link resmi Artea Grup di sini!",
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Gagal menyalin tautan.');
            }
        }
    };

    return (
        <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
            <div className="relative w-full bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8">
                <div className="group absolute top-4 right-4 z-20">
                     <button
                        onClick={handleShareOrCopy}
                        aria-label={isCopied ? "Tautan disalin!" : "Bagikan atau salin halaman"}
                        className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-110"
                    >
                        {isCopied ? (
                            <i className="bi bi-check-lg text-xl text-green-400"></i>
                        ) : (
                            <i className="bi bi-share-fill text-lg"></i>
                        )}
                    </button>
                    <div className="absolute top-full right-0 mt-2 whitespace-nowrap bg-stone-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       {isCopied ? 'Disalin!' : (navigator.share ? 'Bagikan' : 'Salin Tautan')}
                    </div>
                </div>

                <Header />
                <div className="mt-8 w-full">
                    {/* Brands Category */}
                    <div className="space-y-4">
                        <button
                            onClick={() => onNavigate('artea')}
                            aria-label="Buka informasi Artea"
                            className="group flex items-center justify-center w-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-6 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="bi bi-cup-straw mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i>
                            <span>Artea</span>
                        </button>
                         <button
                            onClick={() => onNavigate('janji-koffee')}
                            aria-label="Buka informasi Janji Koffee"
                            className="group flex items-center justify-center w-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-6 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="bi bi-cup-hot-fill mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i>
                            <span>Janji Koffee</span>
                        </button>
                    </div>

                     {/* AI Recommender Button */}
                    <div className="my-6">
                        <button
                            onClick={() => onNavigate('recommender')}
                            aria-label="Coba AI Drink Recommender"
                            className="group w-full bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <div className="flex items-center justify-center">
                                <i className="bi bi-stars mr-3 text-xl transition-transform duration-300 group-hover:rotate-12"></i>
                                <span>Temukan Minumanmu (AI)</span>
                            </div>
                        </button>
                    </div>

                    {/* Information Category */}
                    <div>
                        <h3 className="text-center text-stone-300 text-sm font-semibold mb-3 tracking-wider uppercase">Informasi</h3>
                        <div className="space-y-4">
                            {infoLinks.map((link) => (
                                <LinkButton key={link.id} link={link} />
                            ))}
                            <button
                                onClick={() => onNavigate('about')}
                                aria-label="Buka tentang kami"
                                className="group flex items-center justify-center w-full bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-6 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="bi bi-info-circle-fill mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true"></i>
                                <span>Tentang Kami</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
};

export default HomePage;
