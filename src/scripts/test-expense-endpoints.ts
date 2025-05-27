/**
 * Test script for expense endpoints
 * This script tests the test endpoints that don't require authentication
 */

// Function to fetch data from the API
async function fetchData(url: string) {
    try {
        console.log(`Fetching ${url}...`);
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API error: ${data.error || response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Test expense listing endpoint
async function testExpenseListing() {
    try {
        console.log('\n--- Testing Expense Listing Endpoint ---');
        const data = await fetchData('http://localhost:3000/api/v1/expenses/test');
        
        console.log('✅ Success!');
        console.log(`Found ${data.data.total} expenses, showing ${data.data.expenses.length}`);
        
        // Show a few example expenses
        if (data.data.expenses.length > 0) {
            console.log('\nExample expenses:');
            data.data.expenses.slice(0, 3).forEach((expense: any, index: number) => {
                console.log(`${index + 1}. ${expense.description} - ${expense.amount} ${expense.currency || 'INR'} (${new Date(expense.expense_date).toLocaleDateString()})`);
            });
        }
        
        return data;
    } catch (error) {
        console.error('❌ Expense listing test failed:', error);
        return null;
    }
}

// Test expense categories endpoint
async function testExpenseCategories() {
    try {
        console.log('\n--- Testing Expense Categories Endpoint ---');
        const data = await fetchData('http://localhost:3000/api/v1/expenses/test/categories');
        
        console.log('✅ Success!');
        console.log(`Found ${data.data.total} categories`);
        
        // Show a few example categories
        if (data.data.categories.length > 0) {
            console.log('\nExample categories:');
            data.data.categories.slice(0, 5).forEach((category: any, index: number) => {
                console.log(`${index + 1}. ${category.name}${category.is_system_category ? ' (System)' : ''} - ${category.description || 'No description'}`);
            });
        }
        
        return data;
    } catch (error) {
        console.error('❌ Expense categories test failed:', error);
        return null;
    }
}

// Run all tests
async function runAllTests() {
    console.log('=== Starting Expense API Tests ===');
    
    try {
        // Test expense listing
        const expenseData = await testExpenseListing();
        
        // Test expense categories
        const categoryData = await testExpenseCategories();
        
        console.log('\n=== All Tests Completed ===');
        
        if (expenseData && categoryData) {
            console.log('✅ All tests passed successfully!');
        } else {
            console.log('⚠️ Some tests failed, see errors above');
        }
    } catch (error) {
        console.error('❌ Tests failed with error:', error);
    }
}

// Run the tests
runAllTests(); 