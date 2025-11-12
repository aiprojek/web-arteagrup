// This file contains the logic for the simple, keyword-based local "AI" recommender.

type Drink = string;
type Menu = Drink[];

// The result can now be either a recommendation for a drink or a definition of a term.
export type LocalResult = 
    | { type: 'recommendation'; drink: Drink; reason: string }
    | { type: 'definition'; title: string; content: string }
    | null;

const arteaMenu: Menu = [
    'Teh Original', 'Teh Lemon', 'Teh Leci', 'Teh Markisa', 'Teh Strawberry',
    'Milk Tea', 'Green Tea', 'Green Tea Milk', 'Matcha', 'Americano', 'Spesial Mix',
    'Hazelnut', 'Brown Sugar', 'Tiramisu', 'Vanilla', 'Kappucino', 'Taro',
    'Strawberry', 'Red Velvet', 'Mangga', 'Mojito Strawberry', 'Mojito Markisa',
    'Mojito Mangga', 'Mojito Kiwi', 'Mojito Blue Ocean'
];

const janjiKoffeeMenu: Menu = [
    'Americano', 'Long Black', 'Espresso', 'Spanish Latte', 'Butterscotch', 'Spesial Mix',
    'Kappucino', 'Vanilla', 'Tiramisu', 'Hazelnut', 'Brown Sugar', 'Choco Malt',
    'Creamy Matcha', 'Creamy Green Tea', 'Lemon Squash', 'Blue Ocean'
];

// The "brain" of our local AI. Maps keywords to potential drinks.
const keywordMap: Record<string, Drink[]> = {
    'segar': ['Mojito Strawberry', 'Teh Lemon', 'Teh Leci', 'Lemon Squash', 'Mojito Blue Ocean', 'Blue Ocean'],
    'buah': ['Teh Lemon', 'Teh Leci', 'Teh Markisa', 'Teh Strawberry', 'Mojito Strawberry', 'Mojito Mangga'],
    'kopi': ['Americano', 'Espresso', 'Long Black', 'Spanish Latte', 'Kappucino', 'Hazelnut', 'Brown Sugar', 'Spesial Mix', 'Tiramisu', 'Vanilla'],
    'pahit': ['Americano', 'Espresso', 'Long Black'],
    'susu': ['Milk Tea', 'Spanish Latte', 'Butterscotch', 'Creamy Matcha', 'Creamy Green Tea'],
    'creamy': ['Taro', 'Red Velvet', 'Strawberry', 'Mangga', 'Milk Tea', 'Spanish Latte', 'Creamy Matcha'],
    'manis': ['Brown Sugar', 'Taro', 'Red Velvet', 'Teh Leci', 'Butterscotch', 'Spanish Latte', 'Milk Tea'],
    'teh': ['Teh Original', 'Milk Tea', 'Green Tea', 'Teh Lemon', 'Green Tea Milk'],
    'coklat': ['Choco Malt'],
    'matcha': ['Matcha', 'Creamy Matcha', 'Green Tea', 'Green Tea Milk'],
    'dingin': ['Mojito Strawberry', 'Teh Lemon', 'Lemon Squash'],
    'unik': ['Blue Ocean', 'Taro', 'Butterscotch'],
    'panas': ['Americano', 'Espresso', 'Kappucino', 'Long Black']
};

// Expanded "database" for definitions
const definitionsMap: Record<string, string> = {
    'matcha': 'Matcha adalah teh hijau bubuk dari Jepang yang terkenal dengan rasanya yang khas, sedikit pahit, dan creamy. Beda dari teh hijau biasa, lho! Di Artea, kami punya **Matcha** dan Janji Koffee punya **Creamy Matcha**.',
    'americano': 'Americano adalah minuman kopi yang dibuat dengan mencampurkan espresso dengan air panas. Rasanya kuat dan pahit, cocok banget buat yang butuh semangat ekstra tanpa campuran susu.',
    'long black': 'Long Black adalah kopi hitam yang dibuat dengan menuangkan dua seloki espresso di atas air panas. Ini mempertahankan krema kopi dan memberikan rasa yang lebih kuat dibandingkan Americano. Tersedia di **Janji Koffee**.',
    'spanish latte': 'Spanish Latte adalah varian kopi susu yang lebih manis dan creamy karena menggunakan susu kental manis dan krimer. Rasanya lembut, legit, dan tetap ada tendangan kopinya. Ini salah satu andalan di **Janji Koffee**!',
    'mojito': 'Mojito di Artea adalah minuman soda segar non-alkohol dengan rasa buah-buahan seperti strawberry atau leci. Rasanya super nyegerin, apalagi kalau diminum pas cuaca panas!',
    'espresso': 'Espresso adalah ekstrak kopi murni yang dibuat dengan mesin bertekanan tinggi. Porsinya kecil tapi kafeinnya nendang banget! Ini adalah dasar dari banyak minuman kopi lainnya.',
    'teh original': 'Teh Original kami adalah racikan teh klasik yang disajikan sesuai seleramu, bisa tawar atau manis. Cocok buat kamu yang suka rasa teh otentik.',
    'teh lemon': 'Perpaduan teh khas kami dengan rasa lemon yang super segar. Pilihan tepat untuk melepas dahaga di siang hari!',
    'teh leci': 'Manisnya buah leci bertemu dengan teh pilihan, menciptakan rasa manis-segar yang bikin nagih. Salah satu favorit di Artea!',
    'milk tea': 'Minuman klasik yang disukai semua orang! Teh susu racikan Artea ini punya rasa yang creamy dan seimbang, pas banget buat teman santai.',
    'green tea': 'Nikmati rasa teh hijau yang ringan. Tersedia juga varian **Green Tea Milk** yang lebih creamy.',
    'spesial mix': 'Ini racikan kopi spesial dari kami! Perpaduan kopi, susu, dan bahan spesial lainnya yang menciptakan rasa unik yang wajib kamu coba.',
    'hazelnut': 'Kopi dengan sentuhan sirup hazelnut yang gurih dan wangi. Rasanya mewah dan nyaman banget di lidah.',
    'brown sugar': 'Kopi kekinian dengan manisnya gula aren. Rasa manisnya legit dan punya aroma khas yang menggoda.',
    'tiramisu': 'Terinspirasi dari dessert khas Italia, minuman ini punya rasa kopi, keju, dan coklat yang menyatu. Creamy dan nikmat!',
    'vanilla': 'Kopi susu dengan aroma vanilla yang lembut dan menenangkan. Pilihan aman buat kamu yang suka kopi dengan sentuhan manis.',
    'kappucino': 'Kopi yang terinspirasi dari kopi klasik Italia dengan komposisi yang dimodifikasi yaitu antara espresso, krimer, dan foam. Rasanya bold tapi tetap smooth.',
    'taro': 'Minuman non-kopi dengan rasa talas ungu yang manis, creamy, dan sedikit gurih. Warnanya cantik, rasanya pun enak!',
    'red velvet': 'Rasa kue red velvet dalam bentuk minuman! Perpaduan rasa coklat dan hint rasa keju yang creamy. Manis dan memanjakan.',
    'butterscotch': 'Kopi dengan sirup butterscotch yang punya rasa manis karamel dan sedikit sentuhan butter. Unik dan bikin penasaran!',
    'choco malt': 'Minuman coklat klasik dengan tambahan malt yang memberikan rasa gurih dan khas. Cocok buat segala usia!',
    'creamy matcha': 'Nikmati ketenangan dengan rasa matcha premium yang khas dan lembut dalam balutan susu.',
    'lemon squash': 'Kesegaran maksimal dari lemon dan soda. Pilihan non-kopi yang super menyegarkan dan bikin melek!',
    'blue ocean': 'Minuman soda dengan sirup Blue Curaçao dan sentuhan rasa jeruk. Warnanya biru cantik seperti lautan dan rasanya segar tropis!'
};


// Definitions for special queries
const todayRecommendationPool: Menu = ['Mojito Strawberry', 'Spanish Latte', 'Matcha', 'Teh Leci', 'Butterscotch', 'Spesial Mix', 'Blue Ocean'];
const popularDrinks: Menu = ['Milk Tea', 'Americano', 'Spanish Latte', 'Brown Sugar', 'Spesial mix', 'Blue Ocean', 'Teh Lemon'];


export const getMenuForOutlet = (outlet: 'artea' | 'janji-koffee' | 'semua' | null): Menu => {
    switch (outlet) {
        case 'artea':
            return arteaMenu;
        case 'janji-koffee':
            return janjiKoffeeMenu;
        case 'semua':
        default:
            // Combine and remove duplicates
            return [...new Set([...arteaMenu, ...janjiKoffeeMenu])];
    }
};

export const getLocalRecommendation = (prompt: string, availableMenu: Menu): LocalResult => {
    const lowerCasePrompt = prompt.toLowerCase();

    // Priority 1: Handle definition/informational queries.
    const informationalKeywords = ['apa itu', 'jelaskan', 'pengertian dari', 'definisi dari', 'apa sih'];
    for (const keyword of informationalKeywords) {
        if (lowerCasePrompt.includes(keyword)) {
            const topic = lowerCasePrompt.replace(keyword, '').trim().replace('?','');
            // Find the best match from definition keys
            const defKey = Object.keys(definitionsMap).find(key => topic.includes(key));
            if (defKey) {
                 const title = defKey.charAt(0).toUpperCase() + defKey.slice(1);
                 return { type: 'definition', title: `Tentang ${title}`, content: definitionsMap[defKey] };
            }
        }
    }


    // Priority 2: Handle special recommendation queries.
    const todayKeywords = ['rekomendasi hari ini', 'minuman hari ini', 'minuman buat hari ini'];
    if (todayKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        const availablePool = todayRecommendationPool.filter(drink => availableMenu.includes(drink));
        if (availablePool.length > 0) {
            const randomDrink = availablePool[Math.floor(Math.random() * availablePool.length)];
            return { type: 'recommendation', drink: randomDrink, reason: 'Rekomendasi Hari Ini' };
        }
    }

    const popularKeywords = ['paling populer', 'terlaris', 'best seller', 'paling laku'];
    if (popularKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        const popularChoice = popularDrinks.find(drink => availableMenu.includes(drink));
        if (popularChoice) {
            return { type: 'recommendation', drink: popularChoice, reason: 'Minuman Terlaris' };
        }
    }


    // Priority 3: Check for direct mentions of menu items.
    for (const drink of availableMenu) {
        if (lowerCasePrompt.includes(drink.toLowerCase())) {
            return { type: 'recommendation', drink: drink, reason: drink };
        }
    }

    // Priority 4: Use a scoring system for flavor keywords.
    const foundKeywords = Object.keys(keywordMap).filter(keyword => lowerCasePrompt.includes(keyword));

    if (foundKeywords.length === 0) {
        return null; // No keywords found
    }

    const drinkScores: Record<Drink, number> = {};
    availableMenu.forEach(drink => {
        drinkScores[drink] = 0;
    });

    foundKeywords.forEach(keyword => {
        const potentialDrinks = keywordMap[keyword];
        potentialDrinks.forEach(drink => {
            if (availableMenu.includes(drink)) {
                drinkScores[drink]++;
            }
        });
    });

    let bestMatch = { drink: '', score: 0 };

    for (const drink in drinkScores) {
        if (drinkScores[drink] > bestMatch.score) {
            bestMatch = { drink: drink, score: drinkScores[drink] };
        }
    }
    
    if (bestMatch.score > 0) {
        const contributingKeyword = foundKeywords.find(k => keywordMap[k].includes(bestMatch.drink)) || foundKeywords[0];
        return { type: 'recommendation', drink: bestMatch.drink, reason: contributingKeyword };
    }

    return null; // No match found
};