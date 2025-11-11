// This file contains the logic for the simple, keyword-based local "AI" recommender.

type Drink = string;
type Menu = Drink[];
type LocalResult = { drink: Drink; keyword: string } | null;

const arteaMenu: Menu = [
    'Teh Original', 'Teh Lemon', 'Teh Leci', 'Teh Markisa', 'Teh Strawberry',
    'Milk Tea', 'Green Tea', 'Green Tea Milk', 'Matcha', 'Americano', 'Spesial Mix',
    'Hazelnut', 'Brown Sugar', 'Tiramisu', 'Vanilla', 'Kappucino', 'Taro',
    'Strawberry', 'Red Velvet', 'Mangga', 'Mojito Strawberry', 'Mojito Markisa',
    'Mojito Mangga', 'Mojito Kiwi', 'Mojito Blue Ocean'
];

const janjiKoffeeMenu: Menu = [
    'Americano', 'Espresso', 'Spanish Latte', 'Butterscotch', 'Spesial Mix',
    'Kapuccino', 'Vanilla', 'Tiramisu', 'Hazelnut', 'Brown Sugar', 'Choco Malt',
    'Matcha Latte', 'Creamy Green Tea', 'Lemon Squash', 'Blue Ocean'
];

// The "brain" of our local AI. Maps keywords to potential drinks.
const keywordMap: Record<string, Drink[]> = {
    'segar': ['Mojito Strawberry', 'Teh Lemon', 'Teh Leci', 'Lemon Squash', 'Mojito Blue Ocean', 'Blue Ocean'],
    'buah': ['Teh Lemon', 'Teh Leci', 'Teh Markisa', 'Teh Strawberry', 'Mojito Strawberry', 'Mojito Mangga'],
    'kopi': ['Americano', 'Espresso', 'Spanish Latte', 'Kappucino', 'Hazelnut', 'Brown Sugar', 'Spesial Mix', 'Tiramisu', 'Vanilla', 'Kapuccino'],
    'pahit': ['Americano', 'Espresso'],
    'susu': ['Milk Tea', 'Spanish Latte', 'Butterscotch', 'Matcha Latte', 'Creamy Green Tea'],
    'creamy': ['Taro', 'Red Velvet', 'Strawberry', 'Mangga', 'Milk Tea', 'Spanish Latte', 'Matcha Latte'],
    'manis': ['Brown Sugar', 'Taro', 'Red Velvet', 'Teh Leci', 'Butterscotch', 'Spanish Latte', 'Milk Tea'],
    'teh': ['Teh Original', 'Milk Tea', 'Green Tea', 'Teh Lemon', 'Green Tea Milk'],
    'coklat': ['Choco Malt'],
    'matcha': ['Matcha', 'Matcha Latte', 'Green Tea', 'Green Tea Milk'],
    'dingin': ['Mojito Strawberry', 'Teh Lemon', 'Lemon Squash'],
    'unik': ['Blue Ocean', 'Taro', 'Butterscotch'],
    'panas': ['Americano', 'Espresso', 'Kapuccino']
};

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

    // Priority 1: Check for direct mentions of menu items.
    for (const drink of availableMenu) {
        if (lowerCasePrompt.includes(drink.toLowerCase())) {
            return { drink: drink, keyword: drink };
        }
    }

    // Priority 2: Use a scoring system for keywords.
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

    let bestMatch = { drink: '', score: 0, keyword: '' };

    for (const drink in drinkScores) {
        if (drinkScores[drink] > bestMatch.score) {
            bestMatch = { drink: drink, score: drinkScores[drink], keyword: '' };
        }
    }
    
    // To make the response feel natural, we'll return one of the keywords that led to the recommendation.
    if (bestMatch.score > 0) {
        const contributingKeyword = foundKeywords.find(k => keywordMap[k].includes(bestMatch.drink)) || foundKeywords[0];
        return { drink: bestMatch.drink, keyword: contributingKeyword };
    }

    return null; // No match found
};