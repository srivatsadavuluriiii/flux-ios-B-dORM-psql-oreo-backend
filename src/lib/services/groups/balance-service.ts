/**
 * Flux Balance Service
 * Handles group balance calculations and optimization
 */

import { fluxPostgreSQL } from '../../database/postgres.js';

/**
 * Interface for a balance between two users
 */
interface UserBalance {
    user_id: string;
    other_user_id: string;
    amount: number;
    currency: string;
}

/**
 * Interface for a group member's balance status
 */
interface MemberBalance {
    user_id: string;
    display_name: string;
    full_name: string;
    avatar_url: string;
    total_paid: number;
    total_owed: number;
    balance: number;
    currency: string;
}

/**
 * Interface for optimized settlement recommendation
 */
interface SettlementRecommendation {
    payer_id: string;
    payer_name: string;
    recipient_id: string;
    recipient_name: string;
    amount: number;
    currency: string;
}

/**
 * Balance Service
 * Handles calculations and operations related to balances and settlements
 */
export class BalanceService {
    /**
     * Get balances for all members in a group
     * @param groupId - The group ID
     * @returns Promise with array of member balances
     */
    public static async getGroupBalances(groupId: string): Promise<MemberBalance[]> {
        try {
            const query = `
                WITH member_expenses AS (
                    -- Expenses paid by members
                    SELECT 
                        paid_by_user_id as user_id,
                        SUM(amount) as total_paid,
                        currency
                    FROM expenses
                    WHERE group_id = $1 AND is_deleted = false
                    GROUP BY paid_by_user_id, currency
                ),
                member_splits AS (
                    -- Expenses owed by members
                    SELECT 
                        es.user_id,
                        SUM(es.amount) as total_owed,
                        e.currency
                    FROM expense_splits es
                    JOIN expenses e ON es.expense_id = e.id
                    WHERE e.group_id = $1 AND e.is_deleted = false
                    GROUP BY es.user_id, e.currency
                ),
                all_members AS (
                    -- All group members
                    SELECT 
                        gm.user_id,
                        u.display_name,
                        u.full_name,
                        u.avatar_url
                    FROM group_members gm
                    JOIN users u ON gm.user_id = u.id
                    WHERE gm.group_id = $1 AND gm.is_active = true
                )
                SELECT 
                    am.user_id,
                    am.display_name,
                    am.full_name,
                    am.avatar_url,
                    COALESCE(me.total_paid, 0) as total_paid,
                    COALESCE(ms.total_owed, 0) as total_owed,
                    COALESCE(me.total_paid, 0) - COALESCE(ms.total_owed, 0) as balance,
                    COALESCE(me.currency, COALESCE(ms.currency, 'INR')) as currency
                FROM all_members am
                LEFT JOIN member_expenses me ON am.user_id = me.user_id
                LEFT JOIN member_splits ms ON am.user_id = ms.user_id
                ORDER BY balance DESC
            `;

            const result = await fluxPostgreSQL.query(query, [groupId]);
            return result.rows;
        } catch (error) {
            console.error('[Flux] ❌ Error calculating group balances:', error);
            throw error;
        }
    }

    /**
     * Get detailed balances between users in a group
     * @param groupId - The group ID
     * @returns Promise with array of user-to-user balances
     */
    public static async getDetailedBalances(groupId: string): Promise<UserBalance[]> {
        try {
            const query = `
                WITH expense_balances AS (
                    -- Calculate what each user owes to each payer in the group
                    SELECT 
                        e.paid_by_user_id as creditor_id,
                        es.user_id as debtor_id,
                        SUM(es.amount) as amount,
                        e.currency
                    FROM expenses e
                    JOIN expense_splits es ON e.id = es.expense_id
                    WHERE e.group_id = $1 AND e.is_deleted = false
                    GROUP BY e.paid_by_user_id, es.user_id, e.currency
                ),
                settlement_balances AS (
                    -- Include existing settlements
                    SELECT 
                        recipient_id as creditor_id,
                        payer_id as debtor_id,
                        SUM(amount) as amount,
                        currency
                    FROM settlements
                    WHERE group_id = $1 AND status != 'cancelled'
                    GROUP BY recipient_id, payer_id, currency
                ),
                combined_balances AS (
                    -- Combine expense and settlement balances
                    SELECT 
                        creditor_id, debtor_id, amount, currency
                    FROM expense_balances
                    UNION ALL
                    SELECT 
                        creditor_id, debtor_id, amount, currency
                    FROM settlement_balances
                ),
                net_balances AS (
                    -- Calculate net balances between users
                    SELECT 
                        creditor_id as user_id,
                        debtor_id as other_user_id,
                        SUM(amount) as amount,
                        currency
                    FROM combined_balances
                    GROUP BY creditor_id, debtor_id, currency
                )
                SELECT 
                    user_id,
                    other_user_id,
                    amount,
                    currency
                FROM net_balances
                WHERE amount > 0
                ORDER BY amount DESC
            `;

            const result = await fluxPostgreSQL.query(query, [groupId]);
            return result.rows;
        } catch (error) {
            console.error('[Flux] ❌ Error calculating detailed balances:', error);
            throw error;
        }
    }

    /**
     * Generate optimized settlement recommendations for a group
     * Minimizes the number of transactions needed to settle all debts
     * @param groupId - The group ID
     * @returns Promise with array of settlement recommendations
     */
    public static async getOptimizedSettlements(groupId: string): Promise<SettlementRecommendation[]> {
        try {
            // First get all member balances
            const balances = await this.getGroupBalances(groupId);
            
            // Create arrays of debtors and creditors
            const debtors = balances
                .filter(member => member.balance < 0)
                .map(member => ({
                    user_id: member.user_id,
                    name: member.display_name || member.full_name,
                    avatar_url: member.avatar_url,
                    amount: Math.abs(member.balance)
                }))
                .sort((a, b) => b.amount - a.amount); // Sort by amount desc
                
            const creditors = balances
                .filter(member => member.balance > 0)
                .map(member => ({
                    user_id: member.user_id,
                    name: member.display_name || member.full_name,
                    avatar_url: member.avatar_url,
                    amount: member.balance
                }))
                .sort((a, b) => b.amount - a.amount); // Sort by amount desc
                
            // Get group currency
            const currency = balances.length > 0 && balances[0].currency ? balances[0].currency : 'INR';
            
            // Generate optimized settlements
            const recommendations: SettlementRecommendation[] = [];
            
            // While there are still debtors and creditors with non-zero balances
            while (debtors.length > 0 && creditors.length > 0) {
                const debtor = debtors[0];
                const creditor = creditors[0];
                
                // Calculate settlement amount (minimum of the two balances)
                const amount = Math.min(debtor.amount, creditor.amount);
                
                if (amount > 0) {
                    // Create settlement recommendation
                    recommendations.push({
                        payer_id: debtor.user_id,
                        payer_name: debtor.name,
                        recipient_id: creditor.user_id,
                        recipient_name: creditor.name,
                        amount,
                        currency
                    });
                    
                    // Update balances
                    debtor.amount -= amount;
                    creditor.amount -= amount;
                    
                    // Remove users with zero balance
                    if (debtor.amount <= 0) debtors.shift();
                    if (creditor.amount <= 0) creditors.shift();
                }
            }
            
            return recommendations;
        } catch (error) {
            console.error('[Flux] ❌ Error generating optimized settlements:', error);
            throw error;
        }
    }

    /**
     * Get balances between the current user and other users
     * @param userId - The current user ID
     * @returns Promise with array of balances between user and others
     */
    public static async getUserBalances(userId: string): Promise<{
        balances: any[],
        total_owed: number,
        total_due: number,
        net_balance: number
    }> {
        try {
            const query = `
                WITH outgoing AS (
                    -- Money the user owes to others (from expense splits)
                    SELECT 
                        e.paid_by_user_id as other_user_id,
                        SUM(es.amount) as amount,
                        e.currency
                    FROM expense_splits es
                    JOIN expenses e ON es.expense_id = e.id
                    WHERE es.user_id = $1 AND e.paid_by_user_id != $1 AND e.is_deleted = false
                    GROUP BY e.paid_by_user_id, e.currency
                ),
                incoming AS (
                    -- Money others owe to the user (from expenses paid by user)
                    SELECT 
                        es.user_id as other_user_id,
                        SUM(es.amount) as amount,
                        e.currency
                    FROM expenses e
                    JOIN expense_splits es ON e.id = es.expense_id
                    WHERE e.paid_by_user_id = $1 AND es.user_id != $1 AND e.is_deleted = false
                    GROUP BY es.user_id, e.currency
                ),
                outgoing_settlements AS (
                    -- Outgoing settlements (paid by user)
                    SELECT 
                        recipient_id as other_user_id,
                        SUM(amount) as amount,
                        currency
                    FROM settlements
                    WHERE payer_id = $1 AND status != 'cancelled'
                    GROUP BY recipient_id, currency
                ),
                incoming_settlements AS (
                    -- Incoming settlements (received by user)
                    SELECT 
                        payer_id as other_user_id,
                        SUM(amount) as amount,
                        currency
                    FROM settlements
                    WHERE recipient_id = $1 AND status != 'cancelled'
                    GROUP BY payer_id, currency
                ),
                combined_balance AS (
                    -- Combine all balances
                    SELECT 
                        other_user_id,
                        'outgoing' as type,
                        amount,
                        currency
                    FROM outgoing
                    UNION ALL
                    SELECT 
                        other_user_id,
                        'incoming' as type,
                        amount,
                        currency
                    FROM incoming
                    UNION ALL
                    SELECT 
                        other_user_id,
                        'outgoing_settlement' as type,
                        amount,
                        currency
                    FROM outgoing_settlements
                    UNION ALL
                    SELECT 
                        other_user_id,
                        'incoming_settlement' as type,
                        amount,
                        currency
                    FROM incoming_settlements
                ),
                net_balance AS (
                    -- Calculate net balance with each user
                    SELECT 
                        other_user_id,
                        SUM(CASE 
                            WHEN type = 'outgoing' OR type = 'outgoing_settlement' THEN -amount
                            ELSE amount
                        END) as balance,
                        currency
                    FROM combined_balance
                    GROUP BY other_user_id, currency
                )
                SELECT 
                    nb.other_user_id,
                    u.full_name,
                    u.display_name,
                    u.avatar_url,
                    nb.balance,
                    nb.currency,
                    CASE WHEN nb.balance < 0 THEN -nb.balance ELSE 0 END as you_owe,
                    CASE WHEN nb.balance > 0 THEN nb.balance ELSE 0 END as they_owe
                FROM net_balance nb
                JOIN users u ON nb.other_user_id = u.id
                ORDER BY ABS(nb.balance) DESC
            `;

            const result = await fluxPostgreSQL.query(query, [userId]);
            
            // Calculate totals
            const totalOwed = result.rows.reduce((sum, row) => sum + (row.you_owe || 0), 0);
            const totalDue = result.rows.reduce((sum, row) => sum + (row.they_owe || 0), 0);
            const netBalance = totalDue - totalOwed;
            
            return {
                balances: result.rows,
                total_owed: totalOwed,
                total_due: totalDue,
                net_balance: netBalance
            };
        } catch (error) {
            console.error('[Flux] ❌ Error calculating user balances:', error);
            throw error;
        }
    }
} 