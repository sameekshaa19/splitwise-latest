import { SupabaseService, ServiceResponse, handleServiceError } from './SupabaseService';

interface SnapshotData {
  group: any;
  members: any[];
  expenses: any[];
  balances: { [memberId: string]: number };
  totalExpenses: number;
  generatedAt: string;
}

export const ShareExportService = {
  createSnapshot: async (groupId: string, expiresInDays?: number): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();
      const currentUserId = SupabaseService.getCurrentUserId();

      const { data: group, error: groupError } = await client
        .from('groups')
        .select(`
          *,
          group_members (*)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const { data: expenses, error: expensesError } = await client
        .from('expenses')
        .select(`
          *,
          expense_items (*),
          expense_splits (*)
        `)
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      const balances: { [memberId: string]: number } = {};
      group.group_members.forEach((member: any) => {
        balances[member.id] = member.balance;
      });

      const snapshotData: SnapshotData = {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
          total_expenses: group.total_expenses,
        },
        members: group.group_members,
        expenses: expenses || [],
        balances,
        totalExpenses: group.total_expenses,
        generatedAt: new Date().toISOString(),
      };

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: snapshot, error: snapshotError } = await client
        .from('event_snapshots')
        .insert({
          group_id: groupId,
          snapshot_data: snapshotData,
          created_by: currentUserId,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      return {
        success: true,
        data: {
          snapshotId: snapshot.id,
          shareToken: snapshot.share_token,
          shareUrl: `${process.env.EXPO_PUBLIC_APP_URL || 'https://app.example.com'}/share/${snapshot.share_token}`,
          expiresAt: snapshot.expires_at,
        },
      };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  getSnapshot: async (shareToken: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data: snapshot, error } = await client
        .from('event_snapshots')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;

      if (snapshot.expires_at && new Date(snapshot.expires_at) < new Date()) {
        return {
          success: false,
          error: 'This share link has expired',
        };
      }

      return { success: true, data: snapshot.snapshot_data };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  exportToCSV: (snapshotData: SnapshotData): string => {
    const lines: string[] = [];

    lines.push(`Group: ${snapshotData.group.name}`);
    lines.push(`Description: ${snapshotData.group.description}`);
    lines.push(`Total Expenses: ${snapshotData.totalExpenses}`);
    lines.push(`Generated: ${new Date(snapshotData.generatedAt).toLocaleString()}`);
    lines.push('');

    lines.push('MEMBER BALANCES');
    lines.push('Member,Email,Balance');
    snapshotData.members.forEach((member: any) => {
      lines.push(`"${member.name}","${member.email}",${member.balance}`);
    });
    lines.push('');

    lines.push('EXPENSES');
    lines.push('Date,Description,Amount,Paid By,Type,Vendor');
    snapshotData.expenses.forEach((expense: any) => {
      const date = expense.expense_date || '';
      const desc = expense.description.replace(/"/g, '""');
      const amount = expense.amount;
      const paidBy = expense.paid_by_name.replace(/"/g, '""');
      const type = expense.type;
      const vendor = expense.vendor || '';
      lines.push(`${date},"${desc}",${amount},"${paidBy}",${type},"${vendor}"`);
    });

    return lines.join('\n');
  },

  exportToJSON: (snapshotData: SnapshotData): string => {
    return JSON.stringify(snapshotData, null, 2);
  },

  exportGroupBalances: async (groupId: string): Promise<ServiceResponse> => {
    try {
      const client = SupabaseService.getClient();

      const { data: group, error: groupError } = await client
        .from('groups')
        .select(`
          *,
          group_members (*)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const balances = group.group_members.map((member: any) => ({
        name: member.name,
        email: member.email,
        balance: member.balance,
        owes: member.balance < 0 ? Math.abs(member.balance) : 0,
        owed: member.balance > 0 ? member.balance : 0,
      }));

      return { success: true, data: balances };
    } catch (error) {
      return handleServiceError(error);
    }
  },

  generateSettlementPlan: async (groupId: string): Promise<ServiceResponse> => {
    try {
      const balancesResult = await this.exportGroupBalances(groupId);
      if (!balancesResult.success || !balancesResult.data) {
        throw new Error('Failed to get group balances');
      }

      const balances = balancesResult.data as any[];
      const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
      const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

      const settlements: any[] = [];

      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debt = Math.abs(debtors[i].balance);
        const credit = creditors[j].balance;

        const amount = Math.min(debt, credit);

        settlements.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amount: amount,
        });

        debtors[i].balance += amount;
        creditors[j].balance -= amount;

        if (Math.abs(debtors[i].balance) < 0.01) i++;
        if (Math.abs(creditors[j].balance) < 0.01) j++;
      }

      return { success: true, data: settlements };
    } catch (error) {
      return handleServiceError(error);
    }
  },
};
