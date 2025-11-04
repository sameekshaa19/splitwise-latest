import { SupabaseService, ServiceResponse, handleServiceError } from './SupabaseService';
import { AuditService } from './AuditService';
import { GroupService } from './GroupService';

interface ExpenseItem {
  name: string;
  price: number;
  quantity?: number;
  category?: 'vegetarian' | 'non-vegetarian' | 'other';
}

interface ExpenseSplit {
  userId?: string;
  userName: string;
  amount: number;
  percentage?: number;
  itemId?: string;
}

interface CreateExpenseData {
  description: string;
  amount: number;
  paidBy: string;
  paidByName: string;
  groupId?: string;
  splitType?: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'ITEM_WISE';
  type?: 'manual' | 'scan';
  imageUrl?: string;
  ocrConfidence?: number;
  vendor?: string;
  expenseDate?: string;
  tax?: number;
  currency?: string;
  items?: ExpenseItem[];
  splits?: ExpenseSplit[];
}

export const ExpenseService = {
  createExpense: async (expenseData: CreateExpenseData): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: expense, error: expenseError } = await client
        .from('expenses')
        .insert({
          description: expenseData.description,
          amount: expenseData.amount,
          paid_by: expenseData.paidBy,
          paid_by_name: expenseData.paidByName,
          group_id: expenseData.groupId || null,
          split_type: expenseData.splitType || 'EQUAL',
          type: expenseData.type || 'manual',
          image_url: expenseData.imageUrl || null,
          ocr_confidence: expenseData.ocrConfidence || null,
          vendor: expenseData.vendor || null,
          expense_date: expenseData.expenseDate || new Date().toISOString().split('T')[0],
          tax: expenseData.tax || 0,
          currency: expenseData.currency || 'INR',
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      if (expenseData.items && expenseData.items.length > 0) {
        const itemsToInsert = expenseData.items.map(item => ({
          expense_id: expense.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          category: item.category || 'other',
        }));

        const { error: itemsError } = await client
          .from('expense_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      if (expenseData.splits && expenseData.splits.length > 0) {
        const splitsToInsert = expenseData.splits.map(split => ({
          expense_id: expense.id,
          expense_item_id: split.itemId || null,
          user_id: split.userId || null,
          user_name: split.userName,
          amount: split.amount,
          percentage: split.percentage || null,
          settled: false,
        }));

        const { error: splitsError } = await client
          .from('expense_splits')
          .insert(splitsToInsert);

        if (splitsError) throw splitsError;

        if (expenseData.groupId) {
          await this.updateGroupBalances(expenseData.groupId, expenseData.splits);
        }
      }

      if (expenseData.groupId) {
        const { data: group } = await client
          .from('groups')
          .select('total_expenses')
          .eq('id', expenseData.groupId)
          .single();

        const newTotal = (group?.total_expenses || 0) + expenseData.amount;

        await client
          .from('groups')
          .update({ total_expenses: newTotal })
          .eq('id', expenseData.groupId);
      }

      await AuditService.log({
        entity_type: 'expense',
        entity_id: expense.id,
        action: 'create',
        user_id: currentUserId,
        after_data: { ...expense, items: expenseData.items, splits: expenseData.splits },
      });

      return { success: true, data: expense };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  updateGroupBalances: async (groupId: string, splits: ExpenseSplit[]): Promise<void> => {
    try {
      const client = SupabaseService.getClient();

      for (const split of splits) {
        if (!split.userId) continue;

        const { data: member } = await client
          .from('group_members')
          .select('id, balance')
          .eq('group_id', groupId)
          .eq('user_id', split.userId)
          .single();

        if (member) {
          const newBalance = (member.balance || 0) - split.amount;
          await GroupService.updateMemberBalance(groupId, member.id, newBalance);
        }
      }
    } catch (error) {
      console.error('Error updating group balances:', error);
    }
  },

  getExpenses: async (filters?: {
    groupId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      let query = client
        .from('expenses')
        .select(`
          *,
          expense_items (*),
          expense_splits (*)
        `)
        .order('expense_date', { ascending: false });

      if (filters?.groupId) {
        query = query.eq('group_id', filters.groupId);
      }

      if (filters?.userId) {
        query = query.eq('paid_by', filters.userId);
      }

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  getExpenseById: async (expenseId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data, error } = await client
        .from('expenses')
        .select(`
          *,
          expense_items (*),
          expense_splits (*)
        `)
        .eq('id', expenseId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  updateExpense: async (expenseId: string, updates: Partial<CreateExpenseData>): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: before } = await client
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      const { data: expense, error } = await client
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;

      await AuditService.log({
        entity_type: 'expense',
        entity_id: expenseId,
        action: 'update',
        user_id: currentUserId,
        before_data: before,
        after_data: expense,
      });

      return { success: true, data: expense };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  deleteExpense: async (expenseId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: expense } = await client
        .from('expenses')
        .select('*, expense_splits(*)')
        .eq('id', expenseId)
        .single();

      if (expense?.group_id) {
        const { data: group } = await client
          .from('groups')
          .select('total_expenses')
          .eq('id', expense.group_id)
          .single();

        const newTotal = Math.max(0, (group?.total_expenses || 0) - expense.amount);

        await client
          .from('groups')
          .update({ total_expenses: newTotal })
          .eq('id', expense.group_id);
      }

      const { error } = await client
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      await AuditService.log({
        entity_type: 'expense',
        entity_id: expenseId,
        action: 'delete',
        user_id: currentUserId,
        before_data: expense,
      });

      return { success: true };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  settleExpenseSplit: async (splitId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data, error } = await client
        .from('expense_splits')
        .update({
          settled: true,
          settled_at: new Date().toISOString(),
        })
        .eq('id', splitId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleServiceError(error);
    }
  },
};
