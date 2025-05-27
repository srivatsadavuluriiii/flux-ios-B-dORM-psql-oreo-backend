/**
 * Seed script for expense test data
 * Creates system categories and test expenses
 */

import { fluxPostgreSQL } from '../lib/database/postgres.js';

// System categories to seed
const systemCategories = [
    {
        name: 'Food & Dining',
        description: 'Expenses related to food, restaurants, cafes, and dining',
        icon_name: 'restaurant',
        color_hex: '#FF5733'
    },
    {
        name: 'Transportation',
        description: 'Expenses related to transport including uber, taxi, bus, train',
        icon_name: 'car',
        color_hex: '#3366FF'
    },
    {
        name: 'Housing',
        description: 'Rent, utilities, maintenance, and other housing expenses',
        icon_name: 'home',
        color_hex: '#33FF57'
    },
    {
        name: 'Entertainment',
        description: 'Movies, concerts, events, subscriptions',
        icon_name: 'movie',
        color_hex: '#9933FF'
    },
    {
        name: 'Shopping',
        description: 'Retail purchases, clothing, electronics',
        icon_name: 'shopping_bag',
        color_hex: '#FF33CC'
    },
    {
        name: 'Health',
        description: 'Medical expenses, pharmacy, fitness',
        icon_name: 'medical_services',
        color_hex: '#33FFCC'
    },
    {
        name: 'Travel',
        description: 'Vacations, hotels, flights, travel expenses',
        icon_name: 'flight',
        color_hex: '#CCFF33'
    },
    {
        name: 'Education',
        description: 'Tuition, books, courses, learning materials',
        icon_name: 'school',
        color_hex: '#FF9933'
    },
    {
        name: 'Gifts & Donations',
        description: 'Presents, charity, donations',
        icon_name: 'card_giftcard',
        color_hex: '#FF3366'
    },
    {
        name: 'Business',
        description: 'Work-related expenses',
        icon_name: 'business',
        color_hex: '#3399FF'
    }
];

// Main function to seed data
async function seedExpenseData() {
    try {
        console.log('Starting expense data seeding...');

        // Check if categories already exist
        const categoriesCheck = await fluxPostgreSQL.query(
            'SELECT COUNT(*) FROM expense_categories WHERE is_system_category = true'
        );
        
        const categoriesCount = parseInt(categoriesCheck.rows[0].count);
        
        if (categoriesCount > 0) {
            console.log(`System categories already exist (${categoriesCount} found). Skipping category creation.`);
        } else {
            // Create system categories
            console.log('Creating system categories...');
            
            for (const category of systemCategories) {
                await fluxPostgreSQL.query(
                    `INSERT INTO expense_categories (
                        name, description, icon_name, color_hex, is_system_category, is_public
                    ) VALUES ($1, $2, $3, $4, true, true)`,
                    [category.name, category.description, category.icon_name, category.color_hex]
                );
                console.log(`✅ Created system category: ${category.name}`);
            }
            
            console.log('System categories created successfully!');
        }

        // Get first user for test expenses
        const usersResult = await fluxPostgreSQL.query('SELECT id FROM users LIMIT 1');
        
        if (usersResult.rowCount === 0) {
            console.log('⚠️ No users found in the database. Please create users first.');
            return;
        }
        
        const userId = usersResult.rows[0].id;
        console.log(`Using user ID ${userId} for test expenses`);
        
        // Get category IDs
        const categoriesResult = await fluxPostgreSQL.query(
            'SELECT id, name FROM expense_categories WHERE is_system_category = true'
        );
        
        const categories = categoriesResult.rows;
        console.log(`Found ${categories.length} system categories`);
        
        // Check if test expenses already exist
        const expensesCheck = await fluxPostgreSQL.query(
            'SELECT COUNT(*) FROM expenses WHERE description LIKE \'Test Expense%\''
        );
        
        const expensesCount = parseInt(expensesCheck.rows[0].count);
        
        if (expensesCount > 0) {
            console.log(`Test expenses already exist (${expensesCount} found). Skipping test expense creation.`);
        } else {
            // Create test expenses
            console.log('Creating test expenses...');
            
            // Create one expense for each category
            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                const amount = Math.floor(Math.random() * 1000) + 100; // Random amount between 100-1100
                
                await fluxPostgreSQL.query(
                    `INSERT INTO expenses (
                        description, amount, currency, category_id, expense_date, 
                        location, paid_by_user_id, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        `Test Expense for ${category.name}`,
                        amount,
                        'INR',
                        category.id,
                        new Date().toISOString().split('T')[0], // Today
                        'Mumbai, India',
                        userId,
                        'active'
                    ]
                );
                
                console.log(`✅ Created test expense for category: ${category.name}`);
            }
            
            // Create a few expenses from previous dates
            const pastDates = [
                new Date(Date.now() - 86400000 * 7), // 7 days ago
                new Date(Date.now() - 86400000 * 14), // 14 days ago
                new Date(Date.now() - 86400000 * 30), // 30 days ago
            ];
            
            for (let i = 0; i < pastDates.length; i++) {
                const date = pastDates[i];
                const categoryIndex = Math.floor(Math.random() * categories.length);
                const category = categories[categoryIndex];
                const amount = Math.floor(Math.random() * 1000) + 100;
                
                await fluxPostgreSQL.query(
                    `INSERT INTO expenses (
                        description, amount, currency, category_id, expense_date, 
                        location, paid_by_user_id, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        `Test Expense from ${date.toISOString().split('T')[0]}`,
                        amount,
                        'INR',
                        category.id,
                        date.toISOString().split('T')[0],
                        'Mumbai, India',
                        userId,
                        'active'
                    ]
                );
                
                console.log(`✅ Created test expense for date: ${date.toISOString().split('T')[0]}`);
            }
            
            console.log('Test expenses created successfully!');
        }

        console.log('✅ Expense data seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding expense data:', error);
    } finally {
        // Close connection
        process.exit(0);
    }
}

// Run the seed function
seedExpenseData(); 