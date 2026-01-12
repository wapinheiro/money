import Dexie from 'dexie';

export const db = new Dexie('MoneyAppDB');

db.version(1).stores({
    transactions: '++id, date, amount, merchantId, categoryId',
    merchants: '++id, name, defaultCategoryId',
    categories: '++id, name, icon'
});

db.version(2).stores({
    transactions: '++id, date, amount, merchantId, categoryId',
    merchants: '++id, name, defaultCategoryId',
    categories: '++id, name, icon',
    accounts: '++id, name' // New table
});

// Seed Function
export async function seedDatabase() {
    // 1. Categories (Ensure they exist)
    let catDining = await db.categories.where('name').equals('Dining').first();
    if (!catDining) catDining = await db.categories.add({ name: 'Dining', icon: '🍔' });
    else catDining = catDining.id;
    if (typeof catDining === 'object') catDining = catDining.id;

    let catGroceries = await db.categories.where('name').equals('Groceries').first();
    if (!catGroceries) catGroceries = await db.categories.add({ name: 'Groceries', icon: '🛒' });
    else catGroceries = catGroceries.id;

    let catTransport = await db.categories.where('name').equals('Transport').first();
    if (!catTransport) catTransport = await db.categories.add({ name: 'Transport', icon: '🚗' });
    else catTransport = catTransport.id;

    // 2. Merchants
    const merchants = [
        { name: 'Starbucks', defaultCategoryId: catDining },
        { name: 'Uber', defaultCategoryId: catTransport },
        { name: 'Whole Foods', defaultCategoryId: catGroceries },
        { name: 'Walmart', defaultCategoryId: catGroceries },
        { name: 'McDonalds', defaultCategoryId: catDining },
        { name: 'Wendy', defaultCategoryId: catDining },
        { name: 'Taco Bell', defaultCategoryId: catDining }
    ];

    for (const m of merchants) {
        const exists = await db.merchants.where('name').equals(m.name).count();
        if (exists === 0) {
            await db.merchants.add(m);
        }
    }

    // 3. Accounts
    const accounts = [
        { name: 'Uber card' },
        { name: 'OnePay card' },
        { name: 'MACU' },
        { name: 'Venmo' }
    ];

    for (const a of accounts) {
        const exists = await db.accounts.where('name').equals(a.name).count();
        if (exists === 0) {
            await db.accounts.add(a);
        }
    }

    console.log("Database Seeded/Updated! 🌱");
}
