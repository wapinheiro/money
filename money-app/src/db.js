import Dexie from 'dexie';

export const db = new Dexie('MoneyAppDB');

// Version 1 (Baseline)
db.version(1).stores({
    transactions: '++id, date, amount, merchantId, categoryId',
    merchants: '++id, name, defaultCategoryId',
    categories: '++id, name, icon'
});

// Version 2 (Added Accounts)
db.version(2).stores({
    transactions: '++id, date, amount, merchantId, categoryId',
    merchants: '++id, name, defaultCategoryId',
    categories: '++id, name, icon',
    accounts: '++id, name'
});

// Version 3 (Rich Data Expansion)
db.version(3).stores({
    transactions: '++id, date, amount, currency, merchantId, categoryId, accountId, status', // Added indices
    merchants: '++id, name, defaultCategoryId, mcc', // Added mcc
    categories: '++id, name, icon, type, parentId', // Added type
    accounts: '++id, name, type, institution' // Added type/institution
});

// Seed Function (Idempotent Upsert)
export async function seedDatabase() {

    // 1. Categories (Rich Data)
    const categories = [
        { name: 'Dining', icon: '🍔', color: '#FF9500', type: 'expense' },
        { name: 'Groceries', icon: '🛒', color: '#30D158', type: 'expense' },
        { name: 'Transport', icon: '🚗', color: '#0A84FF', type: 'expense' },
        { name: 'Shopping', icon: '🛍️', color: '#BF5AF2', type: 'expense' },
        { name: 'Income', icon: '💰', color: '#32D74B', type: 'income' }
    ];

    const catMap = {}; // Name -> ID map

    for (const c of categories) {
        const existing = await db.categories.where('name').equals(c.name).first();
        if (existing) {
            // Update existing with new fields (color, etc) if missing
            await db.categories.update(existing.id, c);
            catMap[c.name] = existing.id;
        } else {
            const id = await db.categories.add(c);
            catMap[c.name] = id;
        }
    }

    // 2. Merchants (Rich Data)
    // We strive to update existing ones or add new ones
    const merchants = [
        {
            name: 'Starbucks',
            defaultCategoryId: catMap['Dining'],
            color: '#00704A',
            logo: '☕', // Using emoji as logo placeholder for now
            aliases: ['SBUX', 'Starbucks Coffee'],
            mcc: 5812
        },
        {
            name: 'Uber',
            defaultCategoryId: catMap['Transport'],
            color: '#000000',
            logo: '🚗',
            aliases: ['Uber Trip', 'Uber Eats'],
            mcc: 4121
        },
        {
            name: 'Whole Foods',
            defaultCategoryId: catMap['Groceries'],
            color: '#00583D',
            logo: '🥬',
            aliases: ['WFM'],
            mcc: 5411
        },
        {
            name: 'Walmart',
            defaultCategoryId: catMap['Groceries'],
            color: '#0071CE',
            logo: '🏪',
            aliases: ['WM Supercenter'],
            mcc: 5411
        },
        {
            name: 'McDonalds',
            defaultCategoryId: catMap['Dining'],
            color: '#FFBC0D',
            logo: '🍟',
            aliases: ['MCD'],
            mcc: 5814
        },
        {
            name: 'Wendy',
            defaultCategoryId: catMap['Dining'],
            color: '#E22026',
            logo: '👩🏻‍🦰', // Close enough
            aliases: [],
            mcc: 5814
        },
        {
            name: 'Taco Bell',
            defaultCategoryId: catMap['Dining'],
            color: '#702082',
            logo: '🌮',
            aliases: [],
            mcc: 5814
        }
    ];

    for (const m of merchants) {
        const existing = await db.merchants.where('name').equals(m.name).first();
        if (existing) {
            await db.merchants.update(existing.id, m);
        } else {
            await db.merchants.add(m);
        }
    }

    // 3. Accounts (Rich Data)
    const accounts = [
        { name: 'Uber Card', institution: 'Barclays', type: 'credit', color: '#000000', balance: 0 },
        { name: 'OnePay', institution: 'One', type: 'debit', color: '#5E5CE6', balance: 500.25 },
        { name: 'MACU', institution: 'Mountain America', type: 'checking', color: '#BF5AF2', balance: 1250.00 },
        { name: 'Venmo', institution: 'PayPal', type: 'cash', color: '#30D158', balance: 45.00 }
    ];

    for (const a of accounts) {
        const existing = await db.accounts.where('name').equals(a.name).first();
        if (existing) {
            await db.accounts.update(existing.id, a);
        } else {
            await db.accounts.add(a);
        }
    }

    console.log("Database Schema v3 Seeded! 🌈");
}
