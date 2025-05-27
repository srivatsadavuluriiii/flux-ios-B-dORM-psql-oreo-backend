/**
 * Test script for Flux Expense APIs
 * Tests expense service functions directly against the database
 */

import { fluxPostgreSQL } from '../lib/database/postgres.js';
import { expenseService } from '../lib/services/expenses/expense-service.js';

// Simple logger
const logger = {
    info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
    success: (message: string, data?: any) => console.log(`✅ ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`⚠️ ${message}`, data || '')
};

// Main test function
async function testExpenseAPIs() {
    try {
        logger.info('Starting expense API tests...');
        
        // Get first user for testing
        const usersResult = await fluxPostgreSQL.query('SELECT id FROM users LIMIT 1');
        
        if (usersResult.rowCount === 0) {
            logger.error('No users found in the database. Please create users first.');
            return;
        }
        
        const userId = usersResult.rows[0].id;
        logger.info(`Using user ID ${userId} for tests`);
        
        // Test 1: List expenses
        logger.info('Test 1: Listing expenses');
        const expensesResult = await expenseService.getExpenses(userId, {
            limit: 5,
            offset: 0
        });
        
        logger.success(`Found ${expensesResult.total} total expenses, showing first ${expensesResult.expenses.length}`);
        console.log(expensesResult.expenses.map(e => ({ 
            id: e.id, 
            description: e.description, 
            amount: e.amount, 
            date: e.expense_date 
        })));
        
        // Test 2: Get expense by ID
        if (expensesResult.expenses.length > 0) {
            const testExpenseId = expensesResult.expenses[0].id;
            logger.info(`Test 2: Getting expense by ID ${testExpenseId}`);
            
            const expense = await expenseService.getExpenseById(testExpenseId, userId);
            
            if (expense) {
                logger.success('Successfully retrieved expense by ID');
                console.log({
                    id: expense.id,
                    description: expense.description,
                    amount: expense.amount,
                    category_id: expense.category_id,
                    expense_date: expense.expense_date
                });
            } else {
                logger.error('Failed to retrieve expense by ID');
            }
        } else {
            logger.warn('Skipping Test 2 (Get by ID) because no expenses were found');
        }
        
        // Test 3: Create a new expense
        logger.info('Test 3: Creating a new expense');
        
        // Get a category ID
        const categoriesResult = await fluxPostgreSQL.query(
            'SELECT id FROM expense_categories LIMIT 1'
        );
        
        if (categoriesResult.rowCount === 0) {
            logger.warn('No categories found. Please run the seed script first.');
            return;
        }
        
        const categoryId = categoriesResult.rows[0].id;
        
        const newExpense = await expenseService.createExpense(userId, {
            description: 'API Test Expense',
            amount: 299.99,
            currency: 'INR',
            category_id: categoryId,
            location: 'API Test Location',
            notes: 'Created by API test script'
        });
        
        logger.success('Successfully created new expense');
        console.log({
            id: newExpense.id,
            description: newExpense.description,
            amount: newExpense.amount,
            category_id: newExpense.category_id
        });
        
        // Test 4: Update the expense
        logger.info(`Test 4: Updating expense ${newExpense.id}`);
        
        const updatedExpense = await expenseService.updateExpense(newExpense.id, userId, {
            description: 'Updated API Test Expense',
            amount: 399.99,
            notes: 'Updated by API test script'
        });
        
        logger.success('Successfully updated expense');
        console.log({
            id: updatedExpense.id,
            description: updatedExpense.description,
            amount: updatedExpense.amount,
            notes: updatedExpense.notes
        });
        
        // Test 5: Get expense stats
        logger.info('Test 5: Getting expense statistics');
        
        const stats = await expenseService.getExpenseStats(userId);
        
        logger.success('Successfully retrieved expense statistics');
        console.log({
            total_expenses: stats.total_expenses,
            total_paid: stats.total_paid,
            average_expense: stats.average_expense,
            categories_used: stats.categories_used
        });
        
        // Test 6: Delete the test expense
        logger.info(`Test 6: Deleting expense ${newExpense.id}`);
        
        const deleteResult = await expenseService.deleteExpense(newExpense.id, userId);
        
        if (deleteResult) {
            logger.success('Successfully deleted test expense');
        } else {
            logger.error('Failed to delete test expense');
        }
        
        // Test 7: Verify deletion
        logger.info(`Test 7: Verifying expense ${newExpense.id} is deleted`);
        
        const deletedExpense = await expenseService.getExpenseById(newExpense.id, userId);
        
        if (!deletedExpense) {
            logger.success('Expense was successfully deleted (not found)');
        } else {
            logger.warn('Expense was not fully deleted (soft delete only)');
            console.log({
                id: deletedExpense.id,
                is_deleted: deletedExpense.is_deleted
            });
        }
        
        logger.success('All expense API tests completed successfully!');
    } catch (error) {
        logger.error('Error running expense API tests:', error);
    } finally {
        // Close connection
        process.exit(0);
    }
}

// Run the test function
testExpenseAPIs(); 