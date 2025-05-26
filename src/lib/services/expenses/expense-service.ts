/**
 * Expense Service for Flux
 * Handles expense CRUD operations, validation, and business logic
 */

import { fluxPostgreSQL } from '../../database/postgres.js';
import type { QueryConfig } from 'pg';

// Simple logger for now
const logger = {
    info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || '')
};

// Types and interfaces
export interface CreateExpenseData {
    description: string;
    amount: number;
    currency?: string;
    category_id?: string;
    expense_date?: string;
    location?: string;
    group_id?: string;
    split_method?: 'equal' | 'percentage' | 'exact' | 'manual';
    split_data?: any;
    notes?: string;
    receipt_url?: string;
    receipt_filename?: string;
}

export interface UpdateExpenseData {
    description?: string;
    amount?: number;
    currency?: string;
    category_id?: string;
    expense_date?: string;
    location?: string;
    split_method?: 'equal' | 'percentage' | 'exact' | 'manual';
    split_data?: any;
    notes?: string;
    status?: 'active' | 'settled' | 'disputed' | 'deleted';
}

export interface ExpenseFilters {
    user_id?: string;
    group_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    currency?: string;
    status?: string;
    is_settled?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: 'created_at' | 'expense_date' | 'amount' | 'description';
    sort_order?: 'ASC' | 'DESC';
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    currency: string;
    category_id?: string;
    expense_date: string;
    location?: string;
    paid_by_user_id: string;
    group_id?: string;
    receipt_url?: string;
    receipt_filename?: string;
    receipt_file_size?: number;
    split_method: string;
    split_data?: any;
    ocr_text?: string;
    ocr_confidence?: number;
    ai_suggested_category_id?: string;
    ai_confidence?: number;
    status: string;
    notes?: string;
    is_settled: boolean;
    settled_at?: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

class ExpenseService {
    private logger = logger;

    /**
     * Create a new expense
     */
    async createExpense(userId: string, expenseData: CreateExpenseData): Promise<Expense> {
        try {
            this.logger.info('[Flux Expenses] Creating new expense', { userId, description: expenseData.description });

            // Validate required fields
            this.validateCreateExpenseData(expenseData);

            const query: QueryConfig = {
                text: `
                    INSERT INTO expenses (
                        description, amount, currency, category_id, expense_date, 
                        location, paid_by_user_id, group_id, split_method, split_data, 
                        notes, receipt_url, receipt_filename
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                    ) RETURNING *
                `,
                values: [
                    expenseData.description,
                    expenseData.amount,
                    expenseData.currency || 'INR',
                    expenseData.category_id || null,
                    expenseData.expense_date || new Date().toISOString().split('T')[0],
                    expenseData.location || null,
                    userId,
                    expenseData.group_id || null,
                    expenseData.split_method || 'equal',
                    expenseData.split_data ? JSON.stringify(expenseData.split_data) : null,
                    expenseData.notes || null,
                    expenseData.receipt_url || null,
                    expenseData.receipt_filename || null
                ]
            };

            const result = await fluxPostgreSQL.query(query.text, query.values);
            const expense = result.rows[0];

            // If this is a group expense, create expense splits
            if (expense.group_id) {
                await this.createExpenseSplits(expense.id, expense.group_id, expense.amount, expense.split_method);
            }

            this.logger.info('[Flux Expenses] ✅ Expense created successfully', { expenseId: expense.id });
            return expense;

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to create expense', { error, userId });
            throw new Error('Failed to create expense');
        }
    }

    /**
     * Get expense by ID
     */
    async getExpenseById(expenseId: string, userId: string): Promise<Expense | null> {
        try {
            const query: QueryConfig = {
                text: `
                    SELECT e.*, 
                           ec.name as category_name,
                           ec.icon_name as category_icon,
                           ec.color_hex as category_color,
                           u.display_name as paid_by_name
                    FROM expenses e
                    LEFT JOIN expense_categories ec ON e.category_id = ec.id
                    LEFT JOIN users u ON e.paid_by_user_id = u.id
                    WHERE e.id = $1 
                      AND e.is_deleted = false
                      AND (e.paid_by_user_id = $2 OR e.group_id IN (
                          SELECT group_id FROM group_members WHERE user_id = $2 AND is_active = true
                      ))
                `,
                values: [expenseId, userId]
            };

            const result = await fluxPostgreSQL.query(query.text, query.values);
            return result.rows[0] || null;

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to get expense', { error, expenseId, userId });
            throw new Error('Failed to get expense');
        }
    }

    /**
     * Get expenses with filters
     */
    async getExpenses(userId: string, filters: ExpenseFilters = {}): Promise<{ expenses: Expense[], total: number }> {
        try {
            const { whereClause, values, limit, offset } = this.buildExpenseQuery(userId, filters);

            // Get total count
            const countQuery: QueryConfig = {
                text: `
                    SELECT COUNT(*) as total
                    FROM expenses e
                    LEFT JOIN group_members gm ON e.group_id = gm.group_id
                    ${whereClause}
                `,
                values: values.slice(0, -2) // Remove limit and offset from count query
            };

            const countResult = await fluxPostgreSQL.query(countQuery.text, countQuery.values);
            const total = parseInt(countResult.rows[0].total);

            // Get expenses
            const expensesQuery: QueryConfig = {
                text: `
                    SELECT DISTINCT e.*, 
                           ec.name as category_name,
                           ec.icon_name as category_icon,
                           ec.color_hex as category_color,
                           u.display_name as paid_by_name,
                           g.name as group_name
                    FROM expenses e
                    LEFT JOIN expense_categories ec ON e.category_id = ec.id
                    LEFT JOIN users u ON e.paid_by_user_id = u.id
                    LEFT JOIN groups g ON e.group_id = g.id
                    LEFT JOIN group_members gm ON e.group_id = gm.group_id
                    ${whereClause}
                    ORDER BY ${filters.sort_by || 'e.created_at'} ${filters.sort_order || 'DESC'}
                    LIMIT $${values.length - 1} OFFSET $${values.length}
                `,
                values
            };

            const result = await fluxPostgreSQL.query(expensesQuery.text, expensesQuery.values);

            return {
                expenses: result.rows,
                total
            };

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to get expenses', { error, userId, filters });
            throw new Error('Failed to get expenses');
        }
    }

    /**
     * Update expense
     */
    async updateExpense(expenseId: string, userId: string, updateData: UpdateExpenseData): Promise<Expense> {
        try {
            // Verify user can update this expense
            const expense = await this.getExpenseById(expenseId, userId);
            if (!expense) {
                throw new Error('Expense not found or access denied');
            }

            if (expense.paid_by_user_id !== userId) {
                throw new Error('Only the expense creator can update this expense');
            }

            const { setClause, values } = this.buildUpdateQuery(updateData);
            
            const query: QueryConfig = {
                text: `
                    UPDATE expenses 
                    SET ${setClause}, updated_at = NOW()
                    WHERE id = $${values.length + 1} AND is_deleted = false
                    RETURNING *
                `,
                values: [...values, expenseId]
            };

            const result = await fluxPostgreSQL.query(query.text, query.values);
            
            if (result.rows.length === 0) {
                throw new Error('Expense not found or could not be updated');
            }

            this.logger.info('[Flux Expenses] ✅ Expense updated successfully', { expenseId });
            return result.rows[0];

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to update expense', { error, expenseId, userId });
            throw error;
        }
    }

    /**
     * Delete expense (soft delete)
     */
    async deleteExpense(expenseId: string, userId: string): Promise<boolean> {
        try {
            // Verify user can delete this expense
            const expense = await this.getExpenseById(expenseId, userId);
            if (!expense) {
                throw new Error('Expense not found or access denied');
            }

            if (expense.paid_by_user_id !== userId) {
                throw new Error('Only the expense creator can delete this expense');
            }

            const query: QueryConfig = {
                text: `
                    UPDATE expenses 
                    SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
                    WHERE id = $1 AND is_deleted = false
                    RETURNING id
                `,
                values: [expenseId]
            };

            const result = await fluxPostgreSQL.query(query.text, query.values);
            
            if (result.rows.length === 0) {
                throw new Error('Expense not found or already deleted');
            }

            this.logger.info('[Flux Expenses] ✅ Expense deleted successfully', { expenseId });
            return true;

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to delete expense', { error, expenseId, userId });
            throw error;
        }
    }

    /**
     * Get user's expense statistics
     */
    async getExpenseStats(userId: string, filters: { start_date?: string, end_date?: string, group_id?: string } = {}): Promise<any> {
        try {
            let whereClause = `
                WHERE e.is_deleted = false 
                AND (e.paid_by_user_id = $1 OR e.group_id IN (
                    SELECT group_id FROM group_members WHERE user_id = $1 AND is_active = true
                ))
            `;
            const values = [userId];

            if (filters.start_date) {
                values.push(filters.start_date);
                whereClause += ` AND e.expense_date >= $${values.length}`;
            }

            if (filters.end_date) {
                values.push(filters.end_date);
                whereClause += ` AND e.expense_date <= $${values.length}`;
            }

            if (filters.group_id) {
                values.push(filters.group_id);
                whereClause += ` AND e.group_id = $${values.length}`;
            }

            const query: QueryConfig = {
                text: `
                    SELECT 
                        COUNT(*) as total_expenses,
                        SUM(CASE WHEN e.paid_by_user_id = $1 THEN e.amount ELSE 0 END) as total_paid,
                        SUM(CASE WHEN e.paid_by_user_id != $1 THEN 
                            COALESCE((
                                SELECT es.amount FROM expense_splits es 
                                WHERE es.expense_id = e.id AND es.user_id = $1
                            ), 0) 
                        ELSE 0 END) as total_owed,
                        AVG(e.amount) as average_expense,
                        COUNT(DISTINCT e.category_id) as categories_used,
                        COUNT(DISTINCT DATE_TRUNC('month', e.expense_date)) as months_active
                    FROM expenses e
                    ${whereClause}
                `,
                values
            };

            const result = await fluxPostgreSQL.query(query.text, query.values);
            return result.rows[0];

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to get expense stats', { error, userId });
            throw new Error('Failed to get expense statistics');
        }
    }

    /**
     * Private helper methods
     */
    private validateCreateExpenseData(data: CreateExpenseData): void {
        if (!data.description || data.description.trim().length === 0) {
            throw new Error('Expense description is required');
        }

        if (!data.amount || data.amount <= 0) {
            throw new Error('Expense amount must be greater than 0');
        }

        if (data.amount > 999999999.99) {
            throw new Error('Expense amount is too large');
        }
    }

    private buildExpenseQuery(userId: string, filters: ExpenseFilters) {
        let whereClause = `
            WHERE e.is_deleted = false 
            AND (e.paid_by_user_id = $1 OR (gm.user_id = $1 AND gm.is_active = true))
        `;
        const values = [userId];

        if (filters.group_id) {
            values.push(filters.group_id);
            whereClause += ` AND e.group_id = $${values.length}`;
        }

        if (filters.category_id) {
            values.push(filters.category_id);
            whereClause += ` AND e.category_id = $${values.length}`;
        }

        if (filters.start_date) {
            values.push(filters.start_date);
            whereClause += ` AND e.expense_date >= $${values.length}`;
        }

        if (filters.end_date) {
            values.push(filters.end_date);
            whereClause += ` AND e.expense_date <= $${values.length}`;
        }

        if (filters.min_amount) {
            values.push(filters.min_amount.toString());
            whereClause += ` AND e.amount >= $${values.length}`;
        }

        if (filters.max_amount) {
            values.push(filters.max_amount.toString());
            whereClause += ` AND e.amount <= $${values.length}`;
        }

        if (filters.currency) {
            values.push(filters.currency);
            whereClause += ` AND e.currency = $${values.length}`;
        }

        if (filters.status) {
            values.push(filters.status);
            whereClause += ` AND e.status = $${values.length}`;
        }

        if (filters.is_settled !== undefined) {
            values.push(filters.is_settled.toString());
            whereClause += ` AND e.is_settled = $${values.length}`;
        }

        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        values.push(limit.toString(), offset.toString());

        return { whereClause, values, limit, offset };
    }

    private buildUpdateQuery(updateData: UpdateExpenseData) {
        const setClause: string[] = [];
        const values: any[] = [];

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                values.push(value);
                setClause.push(`${key} = $${values.length}`);
            }
        });

        return {
            setClause: setClause.join(', '),
            values
        };
    }

    private async createExpenseSplits(expenseId: string, groupId: string, amount: number, splitMethod: string): Promise<void> {
        try {
            // Get active group members
            const membersQuery: QueryConfig = {
                text: `
                    SELECT user_id FROM group_members 
                    WHERE group_id = $1 AND is_active = true
                `,
                values: [groupId]
            };

            const membersResult = await fluxPostgreSQL.query(membersQuery.text, membersQuery.values);
            const memberCount = membersResult.rows.length;

            if (memberCount === 0) {
                throw new Error('No active group members found');
            }

            // Calculate split amount per person (equal split for now)
            const splitAmount = Number((amount / memberCount).toFixed(2));

            // Create splits for each member
            const splitInserts = membersResult.rows.map((member, index) => {
                // Adjust last member's amount to account for rounding
                const finalAmount = index === memberCount - 1 
                    ? Number((amount - (splitAmount * (memberCount - 1))).toFixed(2))
                    : splitAmount;

                return {
                    text: `
                        INSERT INTO expense_splits (expense_id, user_id, amount, percentage)
                        VALUES ($1, $2, $3, $4)
                    `,
                    values: [expenseId, member.user_id, finalAmount, Number((100 / memberCount).toFixed(2))]
                };
            });

            // Execute all split inserts
            for (const insert of splitInserts) {
                await fluxPostgreSQL.query(insert.text, insert.values);
            }

            this.logger.info('[Flux Expenses] ✅ Expense splits created', { expenseId, memberCount });

        } catch (error) {
            this.logger.error('[Flux Expenses] ❌ Failed to create expense splits', { error, expenseId });
            throw error;
        }
    }
}

export const expenseService = new ExpenseService(); 