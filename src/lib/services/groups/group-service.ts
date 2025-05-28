/**
 * Flux Group Management Service
 * Handles CRUD operations for groups, members, and settlements
 */

import { fluxPostgreSQL } from '../../database/postgres';
import type { FluxUser } from '../../database/supabase';
import { randomBytes } from 'crypto';

// Generate a random join code for groups
function generateJoinCode(): string {
  return randomBytes(4).toString('hex').substring(0, 8).toUpperCase();
}

// Interface for Group data
export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  default_split_method: string;
  is_public: boolean;
  join_code: string | null;
  created_by_user_id: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// Interface for Group Member data
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
  nickname: string | null;
  notification_preferences: any;
  created_at: string;
  updated_at: string;
}

// Interface for creating a new group
export interface CreateGroupInput {
  name: string;
  description?: string;
  currency?: string;
  default_split_method?: string;
  is_public?: boolean;
}

// Interface for updating a group
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  currency?: string;
  default_split_method?: string;
  is_public?: boolean;
  is_active?: boolean;
}

// Interface for adding a member
export interface AddMemberInput {
  user_id: string;
  role?: string;
  nickname?: string;
  notification_preferences?: any;
}

// Interface for balance calculation
export interface GroupBalance {
  user_id: string;
  balance: number;
  currency: string;
}

export class GroupService {
  /**
   * Create a new group
   */
  async createGroup(userId: string, groupData: CreateGroupInput): Promise<Group> {
    try {
      // Generate a join code
      const joinCode = generateJoinCode();
      
      // Insert group
      const query = `
        INSERT INTO groups (
          name, 
          description, 
          currency, 
          default_split_method, 
          is_public, 
          join_code, 
          created_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING *
      `;
      
      const values = [
        groupData.name,
        groupData.description || null,
        groupData.currency || 'INR',
        groupData.default_split_method || 'equal',
        groupData.is_public !== undefined ? groupData.is_public : false,
        joinCode,
        userId
      ];
      
      const result = await fluxPostgreSQL.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create group');
      }
      
      const group = result.rows[0] as Group;
      
      // Add creator as group admin
      await this.addMember(group.id, {
        user_id: userId,
        role: 'admin'
      });
      
      return group;
    } catch (error) {
      console.error('[Flux Group Service] Error creating group:', error);
      throw error;
    }
  }
  
  /**
   * Get a group by ID
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const query = `SELECT * FROM groups WHERE id = $1`;
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rows.length > 0 ? result.rows[0] as Group : null;
    } catch (error) {
      console.error('[Flux Group Service] Error getting group:', error);
      throw error;
    }
  }
  
  /**
   * Update a group
   */
  async updateGroup(groupId: string, updateData: UpdateGroupInput): Promise<Group | null> {
    try {
      // Build update fields
      const updates = [];
      const values = [groupId]; // First parameter is group ID
      let paramIndex = 2;
      
      if (updateData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(updateData.name);
        paramIndex++;
      }
      
      if (updateData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(updateData.description);
        paramIndex++;
      }
      
      if (updateData.currency !== undefined) {
        updates.push(`currency = $${paramIndex}`);
        values.push(updateData.currency);
        paramIndex++;
      }
      
      if (updateData.default_split_method !== undefined) {
        updates.push(`default_split_method = $${paramIndex}`);
        values.push(updateData.default_split_method);
        paramIndex++;
      }
      
      if (updateData.is_public !== undefined) {
        updates.push(`is_public = $${paramIndex}`);
        values.push(updateData.is_public.toString());
        paramIndex++;
      }
      
      if (updateData.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(updateData.is_active.toString());
        paramIndex++;
        
        // If archiving the group
        if (updateData.is_active === false) {
          updates.push(`archived_at = NOW()`);
        } else {
          updates.push(`archived_at = NULL`);
        }
      }
      
      if (updates.length === 0) {
        return this.getGroupById(groupId);
      }
      
      const query = `
        UPDATE groups
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await fluxPostgreSQL.query(query, values);
      
      return result.rows.length > 0 ? result.rows[0] as Group : null;
    } catch (error) {
      console.error('[Flux Group Service] Error updating group:', error);
      throw error;
    }
  }
  
  /**
   * Delete a group (soft delete by setting is_active to false)
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE groups
        SET is_active = false, archived_at = NOW()
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('[Flux Group Service] Error deleting group:', error);
      throw error;
    }
  }
  
  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string, includeArchived: boolean = false): Promise<Group[]> {
    try {
      const query = `
        SELECT g.* 
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1
        AND gm.is_active = true
        ${includeArchived ? '' : 'AND g.is_active = true'}
        ORDER BY g.created_at DESC
      `;
      
      const result = await fluxPostgreSQL.query(query, [userId]);
      
      return result.rows as Group[];
    } catch (error) {
      console.error('[Flux Group Service] Error getting user groups:', error);
      throw error;
    }
  }
  
  /**
   * Join a group using join code
   */
  async joinGroupByCode(userId: string, joinCode: string): Promise<Group | null> {
    try {
      // Start a transaction
      await fluxPostgreSQL.query('BEGIN');
      
      // Find the group by join code
      const groupQuery = `
        SELECT * FROM groups 
        WHERE join_code = $1 
        AND is_active = true
      `;
      
      const groupResult = await fluxPostgreSQL.query(groupQuery, [joinCode]);
      
      if (groupResult.rows.length === 0) {
        await fluxPostgreSQL.query('ROLLBACK');
        return null;
      }
      
      const group = groupResult.rows[0] as Group;
      
      // Check if user is already a member
      const memberCheckQuery = `
        SELECT * FROM group_members
        WHERE group_id = $1 AND user_id = $2
      `;
      
      const memberCheckResult = await fluxPostgreSQL.query(memberCheckQuery, [group.id, userId]);
      
      if (memberCheckResult.rows.length > 0) {
        // If member exists but is inactive, reactivate
        if (!memberCheckResult.rows[0].is_active) {
          const reactivateQuery = `
            UPDATE group_members
            SET is_active = true, left_at = NULL
            WHERE group_id = $1 AND user_id = $2
            RETURNING *
          `;
          
          await fluxPostgreSQL.query(reactivateQuery, [group.id, userId]);
        }
        
        await fluxPostgreSQL.query('COMMIT');
        return group;
      }
      
      // Add user to group as a member
      await this.addMember(group.id, {
        user_id: userId,
        role: 'member'
      });
      
      await fluxPostgreSQL.query('COMMIT');
      return group;
    } catch (error) {
      await fluxPostgreSQL.query('ROLLBACK');
      console.error('[Flux Group Service] Error joining group by code:', error);
      throw error;
    }
  }
  
  /**
   * Regenerate join code for a group
   */
  async regenerateJoinCode(groupId: string): Promise<string> {
    try {
      const newJoinCode = generateJoinCode();
      
      const query = `
        UPDATE groups
        SET join_code = $1
        WHERE id = $2
        RETURNING join_code
      `;
      
      const result = await fluxPostgreSQL.query(query, [newJoinCode, groupId]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to regenerate join code');
      }
      
      return result.rows[0].join_code;
    } catch (error) {
      console.error('[Flux Group Service] Error regenerating join code:', error);
      throw error;
    }
  }
  
  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string, includeInactive: boolean = false): Promise<GroupMember[]> {
    try {
      const query = `
        SELECT gm.* 
        FROM group_members gm
        WHERE gm.group_id = $1
        ${includeInactive ? '' : 'AND gm.is_active = true'}
        ORDER BY gm.role = 'admin' DESC, gm.joined_at ASC
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rows as GroupMember[];
    } catch (error) {
      console.error('[Flux Group Service] Error getting group members:', error);
      throw error;
    }
  }
  
  /**
   * Add a member to a group
   */
  async addMember(groupId: string, memberData: AddMemberInput): Promise<GroupMember> {
    try {
      const query = `
        INSERT INTO group_members (
          group_id,
          user_id,
          role,
          nickname,
          notification_preferences
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING *
      `;
      
      const values = [
        groupId,
        memberData.user_id,
        memberData.role || 'member',
        memberData.nickname || null,
        memberData.notification_preferences || JSON.stringify({
          new_expense: true,
          settlements: true,
          reminders: true
        })
      ];
      
      const result = await fluxPostgreSQL.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to add member to group');
      }
      
      return result.rows[0] as GroupMember;
    } catch (error) {
      console.error('[Flux Group Service] Error adding member:', error);
      throw error;
    }
  }
  
  /**
   * Update a group member
   */
  async updateMember(groupId: string, userId: string, updates: Partial<GroupMember>): Promise<GroupMember | null> {
    try {
      const updateFields = [];
      const values = [groupId, userId]; // First parameters are group ID and user ID
      let paramIndex = 3;
      
      if (updates.role !== undefined) {
        updateFields.push(`role = $${paramIndex}`);
        values.push(updates.role);
        paramIndex++;
      }
      
      if (updates.nickname !== undefined) {
        if (updates.nickname === null) {
          updateFields.push(`nickname = NULL`);
        } else {
          updateFields.push(`nickname = $${paramIndex}`);
          values.push(updates.nickname);
          paramIndex++;
        }
      }
      
      if (updates.notification_preferences !== undefined) {
        updateFields.push(`notification_preferences = $${paramIndex}`);
        values.push(updates.notification_preferences);
        paramIndex++;
      }
      
      if (updates.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        values.push(updates.is_active.toString());
        paramIndex++;
        
        // If member is leaving, set left_at
        if (updates.is_active === false) {
          updateFields.push(`left_at = NOW()`);
        } else {
          updateFields.push(`left_at = NULL`);
        }
      }
      
      if (updateFields.length === 0) {
        const memberQuery = `
          SELECT * FROM group_members
          WHERE group_id = $1 AND user_id = $2
        `;
        
        const memberResult = await fluxPostgreSQL.query(memberQuery, [groupId, userId]);
        return memberResult.rows.length > 0 ? memberResult.rows[0] as GroupMember : null;
      }
      
      const query = `
        UPDATE group_members
        SET ${updateFields.join(', ')}
        WHERE group_id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await fluxPostgreSQL.query(query, values);
      
      return result.rows.length > 0 ? result.rows[0] as GroupMember : null;
    } catch (error) {
      console.error('[Flux Group Service] Error updating member:', error);
      throw error;
    }
  }
  
  /**
   * Remove a member from a group (soft delete by setting is_active to false)
   */
  async removeMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE group_members
        SET is_active = false, left_at = NOW()
        WHERE group_id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId, userId]);
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('[Flux Group Service] Error removing member:', error);
      throw error;
    }
  }
  
  /**
   * Get user role in a group
   */
  async getUserRole(groupId: string, userId: string): Promise<string | null> {
    try {
      const query = `
        SELECT role FROM group_members
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId, userId]);
      
      return result.rows.length > 0 ? result.rows[0].role : null;
    } catch (error) {
      console.error('[Flux Group Service] Error getting user role:', error);
      throw error;
    }
  }
  
  /**
   * Check if user is a member of a group
   */
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT id FROM group_members
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId, userId]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('[Flux Group Service] Error checking group membership:', error);
      throw error;
    }
  }
  
  /**
   * Calculate balances for all members in a group
   */
  async calculateGroupBalances(groupId: string): Promise<GroupBalance[]> {
    try {
      // This query calculates the net balance for each user in the group
      const query = `
        WITH expense_payments AS (
          -- What each person paid for group expenses
          SELECT 
            paid_by_user_id as user_id,
            SUM(amount) as paid_amount
          FROM expenses
          WHERE group_id = $1 AND is_deleted = false
          GROUP BY paid_by_user_id
        ),
        expense_shares AS (
          -- What each person owes for their share of expenses
          SELECT 
            es.user_id,
            SUM(es.amount) as share_amount
          FROM expense_splits es
          JOIN expenses e ON es.expense_id = e.id
          WHERE e.group_id = $1 AND e.is_deleted = false
          GROUP BY es.user_id
        ),
        direct_payments AS (
          -- Direct payments between users within this group
          SELECT
            payer_user_id as user_id,
            SUM(amount) * -1 as payment_amount -- Negative because paying reduces balance
          FROM payments
          WHERE group_id = $1 AND status = 'completed'
          GROUP BY payer_user_id
          
          UNION ALL
          
          SELECT
            payee_user_id as user_id,
            SUM(amount) as payment_amount -- Positive because receiving increases balance
          FROM payments
          WHERE group_id = $1 AND status = 'completed'
          GROUP BY payee_user_id
        ),
        group_members_list AS (
          -- All active members in the group
          SELECT 
            user_id
          FROM group_members
          WHERE group_id = $1 AND is_active = true
        )
        
        -- Calculate final balance for each member
        SELECT 
          gm.user_id,
          COALESCE(ep.paid_amount, 0) - COALESCE(es.share_amount, 0) + COALESCE(dp.payment_amount, 0) as balance,
          (SELECT currency FROM groups WHERE id = $1) as currency
        FROM group_members_list gm
        LEFT JOIN expense_payments ep ON gm.user_id = ep.user_id
        LEFT JOIN expense_shares es ON gm.user_id = es.user_id
        LEFT JOIN (
          SELECT user_id, SUM(payment_amount) as payment_amount
          FROM direct_payments
          GROUP BY user_id
        ) dp ON gm.user_id = dp.user_id
        ORDER BY balance DESC
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rows as GroupBalance[];
    } catch (error) {
      console.error('[Flux Group Service] Error calculating group balances:', error);
      throw error;
    }
  }
  
  /**
   * Get all expenses in a group
   */
  async getGroupExpenses(groupId: string): Promise<any[]> {
    try {
      const query = `
        SELECT e.*, ec.name as category_name, ec.color_hex as category_color, ec.icon_name as category_icon
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.group_id = $1 AND e.is_deleted = false
        ORDER BY e.expense_date DESC, e.created_at DESC
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rows;
    } catch (error) {
      console.error('[Flux Group Service] Error getting group expenses:', error);
      throw error;
    }
  }
  
  /**
   * Get expense splits for a specific expense
   */
  async getExpenseSplits(expenseId: string): Promise<any[]> {
    try {
      const query = `
        SELECT es.*, u.email, u.user_metadata->'full_name' as user_name
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        WHERE es.expense_id = $1
        ORDER BY es.amount DESC
      `;
      
      const result = await fluxPostgreSQL.query(query, [expenseId]);
      
      return result.rows;
    } catch (error) {
      console.error('[Flux Group Service] Error getting expense splits:', error);
      throw error;
    }
  }
  
  /**
   * Create a settlement payment between users
   */
  async createSettlement(payerUserId: string, payeeUserId: string, groupId: string, amount: number, description: string, paymentMethod: string): Promise<any> {
    try {
      const query = `
        INSERT INTO payments (
          payer_user_id,
          payee_user_id,
          group_id,
          amount,
          currency,
          description,
          payment_method,
          status
        ) VALUES (
          $1, $2, $3, $4, (SELECT currency FROM groups WHERE id = $3), $5, $6, $7
        ) RETURNING *
      `;
      
      const values = [
        payerUserId,
        payeeUserId,
        groupId,
        amount,
        description,
        paymentMethod,
        'completed' // For simplicity, mark as completed immediately
      ];
      
      const result = await fluxPostgreSQL.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create settlement');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('[Flux Group Service] Error creating settlement:', error);
      throw error;
    }
  }
  
  /**
   * Get settlements history for a group
   */
  async getGroupSettlements(groupId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          p.*,
          payer.user_metadata->'full_name' as payer_name,
          payee.user_metadata->'full_name' as payee_name
        FROM payments p
        JOIN users payer ON p.payer_user_id = payer.id
        JOIN users payee ON p.payee_user_id = payee.id
        WHERE p.group_id = $1
        ORDER BY p.created_at DESC
      `;
      
      const result = await fluxPostgreSQL.query(query, [groupId]);
      
      return result.rows;
    } catch (error) {
      console.error('[Flux Group Service] Error getting group settlements:', error);
      throw error;
    }
  }
}

export default new GroupService(); 