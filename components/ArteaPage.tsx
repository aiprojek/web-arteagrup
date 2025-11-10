
import React from 'react';
import MenuTabs from './MenuTabs';

const ArteaPage: React.FC = () => {
    const arteaMenuData = [
        {
            id: 'teh-original',
            icon: <i className="bi bi-leaf font-normal text-2xl text-green-300 w-8 text-center"></i>,
            title: 'Teh Original',
            description: 'Racikan teh klasik dengan aroma dan rasa otentik.',
            variants: ['Tawar', 'Reguler', 'Premium', 'Sultan', 'Super Jumbo'],
        },
        {
            id: 'teh-buah',
            icon: <i className="bi bi-leaf font-normal text-2xl text-orange-300 w-8 text-center"></i>,
            title: 'Teh Buah',
            description: 'Kesegaran teh dengan sentuhan rasa buah.',
            variants: ['Teh Lemon', 'Teh Leci', 'Teh Markisa', 'Teh Strawberry'],
        },
        {
            id: 'teh-series',
            icon: <i className="bi bi-leaf font-normal text-2xl text-teal-300 w-8 text-center"></i>,
            title: 'Teh Series',
            description: 'Koleksi teh susu klasik hingga racikan unik.',
            variants: ['Milk Tea', 'Green Tea', 'Green Tea Milk', 'Matcha'],
        },
        {
            id: 'kopi-series',
            icon: <i className="bi bi-cup-hot text-2xl text-amber-300 w-8 text-center"></i>,
            title: 'Kopi Series',
            description: 'Dari kopi pahit hingga sajian kopi kekinian.',
            variants: ['Americano', 'Spesial Mix', 'Hazelnut', 'Brown Sugar', 'Tiramisu', 'Vanilla', 'Kappucino'],
        },
        {
            id: 'creamy-series',
            icon: <i className="bi bi-cup-straw text-2xl text-pink-300 w-8 text-center"></i>,
            title: 'Creamy Series',
            description: 'Manjakan lidah dengan minuman yang kaya rasa dan lembut.',
            variants: ['Taro', 'Strawberry', 'Red Velvet', 'Mangga'],
        },
        {
            id: 'mojito-series',
            icon: <i className="bi bi-stars text-2xl text-sky-300 w-8 text-center"></i>,
            title: 'Mojito Series',
            description: 'Ledakan kesegaran soda dengan garnis jeruk.',
            variants: ['Mojito Strawberry', 'Mojito Markisa', 'Mojito Mangga', 'Mojito Kiwi', 'Mojito Blue Ocean'],
        },
    ];

    return (
        <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Selamat Datang di Artea</h2>
            <p className="text-center text-stone-400 mb-8">Kesegaran dalam Setiap Tegukan.</p>

            <div className="space-y-6 text-stone-300">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b-2 border-stone-600 pb-2">Menu Unggulan</h3>
                     <MenuTabs menuData={arteaMenuData} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b-2 border-stone-600 pb-2">Lokasi Kami</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-stone-100">Artea Sumpiuh</h4>
                            <p className="text-sm text-stone-400 mt-1">
                                Jl. Pemotongan Pasar No.I, RT.04/RW.01, Barat Pasar, Sumpiuh, Kec. Sumpiuh, Kabupaten Banyumas, Jawa Tengah 53195
                            </p>
                            <a 
                                href="https://maps.app.goo.gl/hJdywPBpkNksKMjL7" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="Lihat Artea Sumpiuh di Google Maps"
                                className="inline-block mt-2 text-sky-400 hover:text-sky-300 transition-colors duration-200 text-sm font-semibold"
                            >
                                <i className="bi bi-geo-alt-fill mr-1" aria-hidden="true"></i>
                                Lihat di Maps
                            </a>
                        </div>
                        <div>
                            <h4 className="font-semibold text-stone-100">Artea Karangwangkal</h4>
                            <p className="text-sm text-stone-400 mt-1">
                                Gg. Gn. Cermai No.35, RT.2/RW.2, Karangwangkal, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53123
                            </p>
                            <a 
                                href="https://maps.app.goo.gl/vuPKivcKBAYUHz6MA" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="Lihat Artea Karangwangkal di Google Maps"
                                className="inline-block mt-2 text-sky-400 hover:text-sky-300 transition-colors duration-200 text-sm font-semibold"
                            >
                                <i className="bi bi-geo-alt-fill mr-1" aria-hidden="true"></i>
                                Lihat di Maps
                            </a>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 border-b-2 border-stone-600 pb-2">Kontak Informasi</h3>
                    <a href="https://wa.me/6281225879494?text=Bismillah" target="_blank" rel="noopener noreferrer" aria-label="Hubungi Artea melalui WhatsApp" className="w-full text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center">
                        <i className="bi bi-whatsapp mr-2" aria-hidden="true"></i> Whatsapp
                    </a>
                </div>
            </div>
        </>
    );
};

export default ArteaPage;