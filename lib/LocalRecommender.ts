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
    'kopi': ['Americano', 'Espresso', 'Spanish Latte', 'Kappucino', 'Hazelnut', 'Brown Sugar'],
    'pahit': ['Americano', 'Espresso'],
    'susu': ['Milk Tea', 'Spanish Latte', 'Butterscotch', 'Matcha Latte', 'Creamy Green Tea'],
    'creamy': ['Taro', 'Red Velvet', 'Strawberry', 'Mangga', 'Milk Tea', 'Spanish Latte'],
    'manis': ['Brown Sugar', 'Taro', 'Red Velvet', 'Teh Leci', 'Butterscotch'],
    'teh': ['Teh Original', 'Milk Tea', 'Green Tea', 'Teh Lemon'],
    'coklat': ['Choco Malt'],
    'matcha': ['Matcha', 'Matcha Latte', 'Green Tea'],
    'dingin': ['Mojito Strawberry', 'Teh Lemon', 'Lemon Squash'],
    'unik': ['Blue Ocean',],
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

    for (const keyword in keywordMap) {
        if (lowerCasePrompt.includes(keyword)) {
            const potentialDrinks = keywordMap[keyword];
            // Find the first drink from the keyword list that is available in the current menu
            const foundDrink = potentialDrinks.find(drink => availableMenu.includes(drink));
            
            if (foundDrink) {
                return { drink: foundDrink, keyword: keyword };
            }
        }
    }

    return null; // No match found
};