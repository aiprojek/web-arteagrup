import React from 'react';
import MenuTabs from './MenuTabs';

const JanjiKoffeePage: React.FC = () => {
    const janjiKoffeeMenuData = [
        {
            id: 'kopi-hitam',
            icon: <i className="bi bi-cup text-2xl text-stone-300 w-8 text-center"></i>,
            title: 'Kopi Hitam',
            description: 'Nikmati rasa otentik biji kopi berkualitas.',
            variants: ['Americano', 'Long Black', 'Espresso'],
        },
        {
            id: 'kopi-series',
            icon: <i className="bi bi-cup-hot text-2xl text-amber-300 w-8 text-center"></i>,
            title: 'Kopi Series',
            description: 'Kreasi kopi spesial untuk setiap selera.',
            variants: ['Spanish Latte', 'Butterscotch', 'Spesial Mix', 'Kappucino', 'Vanilla', 'Tiramisu', 'Hazelnut', 'Brown Sugar'],
        },
        {
            id: 'non-kopi',
            icon: <i className="bi bi-cup-straw text-2xl text-emerald-300 w-8 text-center"></i>,
            title: 'Non Kopi',
            description: 'Pilihan menyegarkan untuk yang tidak minum kopi.',
            variants: ['Choco Malt', 'Creamy Matcha', 'Creamy Green Tea', 'Lemon Squash', 'Blue Ocean'],
        },
    ];

    return (
        <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Selamat Datang di Janji Koffee</h2>
            <p className="text-center text-stone-400 mb-8">Setiap Janji Punya Cerita.</p>

            <div className="space-y-6 text-stone-300">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b-2 border-stone-600 pb-2">Menu Andalan Kami</h3>
                     <MenuTabs menuData={janjiKoffeeMenuData} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b-2 border-stone-600 pb-2">Temukan Kami</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-stone-100">Janji Koffee Tambak</h4>
                            <p className="text-sm text-stone-400 mt-1">
                                Jl. Raya Tambak Kamulyan (utara Polsek Tambak), Kec. Tambak, Kabupaten Banyumas, Jawa Tengah 53196
                            </p>
                            <a 
                                href="https://maps.app.goo.gl/nkPvf7Ahq2vH4jhs7" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="Lihat Janji Koffee Tambak di Google Maps"
                                className="inline-block mt-2 text-[var(--accent-color)] hover:opacity-80 transition-opacity duration-200 text-sm font-semibold"
                            >
                                <i className="bi bi-geo-alt-fill mr-1" aria-hidden="true"></i>
                                Lihat di Maps
                            </a>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 border-b-2 border-stone-600 pb-2">Terhubung</h3>
                    <a href="https://wa.me/6281225879494?text=Bismillah" target="_blank" rel="noopener noreferrer" aria-label="Hubungi Janji Koffee melalui WhatsApp" className="w-full text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center">
                        <i className="bi bi-whatsapp mr-2" aria-hidden="true"></i> Whatsapp
                    </a>
                </div>
            </div>
        </>
    );
};

export default JanjiKoffeePage;