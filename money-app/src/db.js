import Dexie from 'dexie';

export const db = new Dexie('MoneyDB');

db.version(1).stores({
    transactions: '++id, amount, date, status, merchant, category', // Primary key and indexed props
    categories: '++id, name, icon',
    merchants: '++id, name, defaultCategoryId'
});

// Seed data helper
export async function seedDatabase() {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
        await db.categories.bulkAdd([
            { name: 'Groceries', icon: '🍎' },
            { name: 'Dining', icon: '🍔' },
            { name: 'Gas', icon: '⛽' },
            { name: 'Shopping', icon: '🛍️' },
            { name: 'Travel', icon: '✈️' },
            { name: 'Health', icon: '💊' },
            { name: 'Services', icon: '🔧' },
            { name: 'Entertainment', icon: '🎬' }
        ]);
    }
}
