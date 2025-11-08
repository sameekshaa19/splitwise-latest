/**
 * Database Helper Functions for Splitwise Clone
 * Provides utility functions for balance calculations, expense validation, and data operations
 */

export interface BalanceCalculation {
  userId: string;
  userName: string;
  balance: number;
  totalOwed: number;
  totalOwing: number;
  expenses: string[];
}

export interface ExpenseSummary {
  totalExpenses: number;
  userExpenses: number;
  averageExpense: number;
  expenseCount: number;
  largestExpense: number;
  smallestExpense: number;
}

export interface SettlementPlan {
  from: string;
  to: string;
  amount: number;
  fromUser: string;
  toUser: string;
}

/**
 * Calculate group balances from expenses and splits
 */
export function calculateGroupBalances(
  expenses: any[],
  members: any[]
): BalanceCalculation[] {
  const balances: Map<string, BalanceCalculation> = new Map();

  // Initialize all members with zero balance
  members.forEach(member => {
    balances.set(member.user_id || member.email, {
      userId: member.user_id || member.email,
      userName: member.name,
      balance: 0,
      totalOwed: 0,
      totalOwing: 0,
      expenses: []
    });
  });

  // Process each expense
  expenses.forEach(expense => {
    const payerId = expense.paid_by;
    const amount = parseFloat(expense.amount);

    // Add expense to payer's balance (they are owed this amount)
    const payerBalance = balances.get(payerId);
    if (payerBalance) {
      payerBalance.balance += amount;
      payerBalance.totalOwed += amount;
      payerBalance.expenses.push(expense.id);
    }

    // Subtract split amounts from each person
    if (expense.expense_splits) {
      expense.expense_splits.forEach((split: any) => {
        const splitUserId = split.user_id || split.user_name;
        const splitAmount = parseFloat(split.amount);

        const splitBalance = balances.get(splitUserId);
        if (splitBalance) {
          splitBalance.balance -= splitAmount;
          splitBalance.totalOwing += splitAmount;
        }
      });
    }
  });

  return Array.from(balances.values());
}

/**
 * Generate optimal settlement plan for group
 */
export function generateSettlementPlan(balances: BalanceCalculation[]): SettlementPlan[] {
  const debtors = balances
    .filter(b => b.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .map(b => ({ ...b, balance: Math.abs(b.balance) }));

  const creditors = balances
    .filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const settlements: SettlementPlan[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const settlementAmount = Math.min(debtor.balance, creditor.balance);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: settlementAmount,
      fromUser: debtor.userName,
      toUser: creditor.userName
    });

    debtor.balance -= settlementAmount;
    creditor.balance -= settlementAmount;

    if (debtor.balance === 0) debtorIndex++;
    if (creditor.balance === 0) creditorIndex++;
  }

  return settlements;
}

/**
 * Calculate expense summary statistics
 */
export function calculateExpenseSummary(expenses: any[]): ExpenseSummary {
  if (expenses.length === 0) {
    return {
      totalExpenses: 0,
      userExpenses: 0,
      averageExpense: 0,
      expenseCount: 0,
      largestExpense: 0,
      smallestExpense: 0
    };
  }

  const amounts = expenses.map(e => parseFloat(e.amount));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);

  return {
    totalExpenses: total,
    userExpenses: total, // This would be calculated per user
    averageExpense: total / expenses.length,
    expenseCount: expenses.length,
    largestExpense: Math.max(...amounts),
    smallestExpense: Math.min(...amounts)
  };
}

/**
 * Validate expense data before creation
 */
export function validateExpenseData(expenseData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!expenseData.description || expenseData.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!expenseData.amount || expenseData.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!expenseData.paidBy) {
    errors.push('Payer is required');
  }

  if (!expenseData.paidByName || expenseData.paidByName.trim().length === 0) {
    errors.push('Payer name is required');
  }

  // Validate split type
  const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'ITEM_WISE'];
  if (expenseData.splitType && !validSplitTypes.includes(expenseData.splitType)) {
    errors.push('Invalid split type');
  }

  // Validate splits if provided
  if (expenseData.splits && expenseData.splits.length > 0) {
    const totalSplitAmount = expenseData.splits.reduce(
      (sum: number, split: any) => sum + parseFloat(split.amount || 0),
      0
    );

    const expenseAmount = parseFloat(expenseData.amount);
    if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
      errors.push(`Split amounts (${totalSplitAmount}) must equal expense amount (${expenseAmount})`);
    }

    // Validate individual splits
    expenseData.splits.forEach((split: any, index: number) => {
      if (!split.userName || split.userName.trim().length === 0) {
        errors.push(`Split ${index + 1}: User name is required`);
      }
      if (!split.amount || split.amount <= 0) {
        errors.push(`Split ${index + 1}: Amount must be greater than 0`);
      }
    });
  }

  // Validate OCR confidence if provided
  if (expenseData.ocrConfidence !== undefined) {
    const confidence = parseFloat(expenseData.ocrConfidence);
    if (confidence < 0 || confidence > 1) {
      errors.push('OCR confidence must be between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate group data before creation
 */
export function validateGroupData(groupData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!groupData.name || groupData.name.trim().length === 0) {
    errors.push('Group name is required');
  }

  const validTypes = ['trip', 'meal', 'event', 'general'];
  if (groupData.type && !validTypes.includes(groupData.type)) {
    errors.push('Invalid group type');
  }

  // Validate members if provided
  if (groupData.members && groupData.members.length > 0) {
    const emails = new Set<string>();

    groupData.members.forEach((member: any, index: number) => {
      if (!member.name || member.name.trim().length === 0) {
        errors.push(`Member ${index + 1}: Name is required`);
      }

      if (!member.email || member.email.trim().length === 0) {
        errors.push(`Member ${index + 1}: Email is required`);
      } else if (!isValidEmail(member.email)) {
        errors.push(`Member ${index + 1}: Invalid email format`);
      } else if (emails.has(member.email.toLowerCase())) {
        errors.push(`Member ${index + 1}: Duplicate email address`);
      } else {
        emails.add(member.email.toLowerCase());
      }

      const validDietary = ['vegetarian', 'non-vegetarian', 'both'];
      if (member.dietary && !validDietary.includes(member.dietary)) {
        errors.push(`Member ${index + 1}: Invalid dietary preference`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Calculate split amounts based on split type
 */
export function calculateSplits(
  totalAmount: number,
  splitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'ITEM_WISE',
  members: any[],
  providedSplits?: any[],
  items?: any[]
): any[] {
  switch (splitType) {
    case 'EQUAL':
      const equalAmount = totalAmount / members.length;
      return members.map(member => ({
        userId: member.user_id,
        userName: member.name,
        amount: equalAmount,
        percentage: (100 / members.length).toFixed(2)
      }));

    case 'PERCENTAGE':
      if (!providedSplits) return [];
      return providedSplits.map(split => ({
        userId: split.userId,
        userName: split.userName,
        amount: (totalAmount * split.percentage) / 100,
        percentage: split.percentage
      }));

    case 'EXACT':
      if (!providedSplits) return [];
      const totalSplitAmount = providedSplits.reduce(
        (sum: number, split: any) => sum + parseFloat(split.amount || 0),
        0
      );

      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        throw new Error('Split amounts must equal total expense amount');
      }

      return providedSplits.map(split => ({
        userId: split.userId,
        userName: split.userName,
        amount: parseFloat(split.amount),
        percentage: ((parseFloat(split.amount) / totalAmount) * 100).toFixed(2)
      }));

    case 'ITEM_WISE':
      if (!items || !providedSplits) return [];
      const itemAssignments = new Map<string, number>();

      // Calculate amount per user based on assigned items
      items.forEach(item => {
        const assignedUser = providedSplits.find(
          split => split.itemId === item.id || split.userName === item.assignedTo
        );
        if (assignedUser) {
          const current = itemAssignments.get(assignedUser.userName) || 0;
          itemAssignments.set(assignedUser.userName, current + parseFloat(item.price || item.total || 0));
        }
      });

      return Array.from(itemAssignments.entries()).map(([userName, amount]) => ({
        userName,
        amount,
        percentage: ((amount / totalAmount) * 100).toFixed(2)
      }));

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }
}

/**
 * Generate share token for event snapshots
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate expense ID for local storage
 */
export function generateExpenseId(): string {
  return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate group ID for local storage
 */
export function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}