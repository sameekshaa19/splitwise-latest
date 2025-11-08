/**
 * Database Seeding Script for Splitwise Clone
 * Generates realistic test data for development and testing
 */

import { v4 as uuidv4 } from 'uuid';

interface SeedUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface SeedGroup {
  id: string;
  name: string;
  description: string;
  type: 'trip' | 'meal' | 'event' | 'general';
  created_by: string;
  total_expenses: number;
  created_at: string;
  updated_at: string;
}

interface SeedGroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  name: string;
  email: string;
  dietary: 'vegetarian' | 'non-vegetarian' | 'both';
  balance: number;
  joined_at: string;
}

interface SeedExpense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  paid_by_name: string;
  group_id: string;
  split_type: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'ITEM_WISE';
  type: 'manual' | 'scan';
  category: string;
  expense_date: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface SeedExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  created_at: string;
}

interface SeedExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string | null;
  user_name: string;
  amount: number;
  percentage: number | null;
  settled: boolean;
  created_at: string;
}

export class DatabaseSeeder {
  private static readonly INDIAN_NAMES = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Anjali Gupta', 'Vikram Singh',
    'Neha Reddy', 'Rohit Verma', 'Kavita Malhotra', 'Sanjay Joshi', 'Meera Nair',
    'Arjun Mehta', 'Divya Agarwal', 'Karan Chawla', 'Pooja Deshmukh', 'Ravi Iyer'
  ];

  private static readonly EXPENSE_DESCRIPTIONS = {
    food: [
      'Dinner at Mainland China',
      'Lunch at Subway',
      'Coffee at Starbucks',
      'Pizza from Domino\'s',
      'Breakfast at Cafe Coffee Day',
      'Ice cream at Naturals',
      'Snacks at Haldiram\'s',
      'Biryani from Paradise'
    ],
    transport: [
      'Uber to Airport',
      'Ola to Railway Station',
      'Auto Rickshaw to Office',
      'Metro Card Recharge',
      'Petrol for Car',
      'Bike Service',
      'Taxi to Hotel',
      'Airport Pickup'
    ],
    accommodation: [
      'Hotel Taj Gateway',
      'Airbnb Apartment',
      'OYO Rooms',
      'Treebo Hotel',
      'Homestay Booking',
      'Resort Stay',
      'Guest House Booking',
      'Hostel Accommodation'
    ],
    entertainment: [
      'Movie Tickets',
      'Concert Tickets',
      'Gaming Zone',
      'Bowling Alley',
      'Escape Room',
      'Comedy Show',
      'Karaoke Night',
      'Arcade Games'
    ],
    shopping: [
      'Clothes from Zara',
      'Electronics from Croma',
      'Groceries from Big Bazaar',
      'Medicines from Pharmacy',
      'Books from Crossword',
      'Shoes from Nike',
      'Gifts from Archies',
      'Cosmetics from Sephora'
    ]
  };

  private static readonly GROUP_NAMES = [
    'Goa Trip 2024',
    'Weekend Getaway',
    'Team Lunch',
    'Birthday Celebration',
    'Diwali Party',
    'Project Team',
    'Flatmates',
    'College Friends',
    'Family Vacation',
    'Weekend Brunch Club'
  ];

  /**
   * Generate complete seed data
   */
  static generateSeedData(): {
    users: SeedUser[];
    groups: SeedGroup[];
    groupMembers: SeedGroupMember[];
    expenses: SeedExpense[];
    expenseItems: SeedExpenseItem[];
    expenseSplits: SeedExpenseSplit[];
  } {
    const users = this.generateUsers(12);
    const groups = this.generateGroups(users, 8);
    const groupMembers = this.generateGroupMembers(groups, users);
    const expenses = this.generateExpenses(groups, users, 50);
    const expenseItems = this.generateExpenseItems(expenses, 0.3); // 30% have items
    const expenseSplits = this.generateExpenseSplits(expenses, groupMembers);

    return {
      users,
      groups,
      groupMembers,
      expenses,
      expenseItems,
      expenseSplits
    };
  }

  /**
   * Generate users
   */
  private static generateUsers(count: number): SeedUser[] {
    const users: SeedUser[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      users.push({
        id: uuidv4(),
        name: this.INDIAN_NAMES[i % this.INDIAN_NAMES.length],
        email: `user${i + 1}@example.com`,
        created_at: now,
        updated_at: now
      });
    }

    return users;
  }

  /**
   * Generate groups
   */
  private static generateGroups(users: SeedUser[], count: number): SeedGroup[] {
    const groups: SeedGroup[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      const creator = users[Math.floor(Math.random() * users.length)];
      const types: Array<'trip' | 'meal' | 'event' | 'general'> = ['trip', 'meal', 'event', 'general'];

      groups.push({
        id: uuidv4(),
        name: this.GROUP_NAMES[i % this.GROUP_NAMES.length],
        description: `Group for ${this.GROUP_NAMES[i % this.GROUP_NAMES.length].toLowerCase()}`,
        type: types[Math.floor(Math.random() * types.length)],
        created_by: creator.id,
        total_expenses: 0,
        created_at: now,
        updated_at: now
      });
    }

    return groups;
  }

  /**
   * Generate group members
   */
  private static generateGroupMembers(groups: SeedGroup[], users: SeedUser[]): SeedGroupMember[] {
    const groupMembers: SeedGroupMember[] = [];
    const now = new Date().toISOString();

    groups.forEach(group => {
      // Add creator as member
      const creator = users.find(u => u.id === group.created_by)!;
      groupMembers.push({
        id: uuidv4(),
        group_id: group.id,
        user_id: creator.id,
        name: creator.name,
        email: creator.email,
        dietary: 'both',
        balance: 0,
        joined_at: now
      });

      // Add 2-6 additional members
      const memberCount = 2 + Math.floor(Math.random() * 5);
      const availableUsers = users.filter(u => u.id !== group.created_by);

      for (let i = 0; i < memberCount && i < availableUsers.length; i++) {
        const member = availableUsers[i];
        const dietaryOptions: Array<'vegetarian' | 'non-vegetarian' | 'both'> = ['vegetarian', 'non-vegetarian', 'both'];

        groupMembers.push({
          id: uuidv4(),
          group_id: group.id,
          user_id: member.id,
          name: member.name,
          email: member.email,
          dietary: dietaryOptions[Math.floor(Math.random() * dietaryOptions.length)],
          balance: 0,
          joined_at: now
        });
      }
    });

    return groupMembers;
  }

  /**
   * Generate expenses
   */
  private static generateExpenses(groups: SeedGroup[], users: SeedUser[], count: number): SeedExpense[] {
    const expenses: SeedExpense[] = [];
    const categories = Object.keys(this.EXPENSE_DESCRIPTIONS);

    for (let i = 0; i < count; i++) {
      const group = groups[Math.floor(Math.random() * groups.length)];
      const groupMembers = this.getGroupMembers(group.id);
      const payer = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      const category = categories[Math.floor(Math.random() * categories.length)] as keyof typeof this.EXPENSE_DESCRIPTIONS;
      const descriptions = this.EXPENSE_DESCRIPTIONS[category];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];

      // Generate amount based on category
      let amount: number;
      switch (category) {
        case 'food':
          amount = 200 + Math.random() * 3000; // ₹200-₹3200
          break;
        case 'transport':
          amount = 50 + Math.random() * 2000; // ₹50-₹2050
          break;
        case 'accommodation':
          amount = 1000 + Math.random() * 9000; // ₹1000-₹10000
          break;
        case 'entertainment':
          amount = 100 + Math.random() * 1500; // ₹100-₹1600
          break;
        case 'shopping':
          amount = 200 + Math.random() * 5000; // ₹200-₹5200
          break;
        default:
          amount = 100 + Math.random() * 2000;
      }

      amount = Math.round(amount);

      const splitTypes: Array<'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'ITEM_WISE'> = ['EQUAL', 'PERCENTAGE', 'EXACT'];
      const splitType = splitTypes[Math.floor(Math.random() * splitTypes.length)];

      const expenseDate = this.generateRandomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());

      expenses.push({
        id: uuidv4(),
        description,
        amount,
        paid_by: payer.user_id!,
        paid_by_name: payer.name,
        group_id: group.id,
        split_type: splitType,
        type: Math.random() > 0.8 ? 'scan' : 'manual', // 20% scanned
        category,
        expense_date: expenseDate,
        currency: 'INR',
        created_at: expenseDate,
        updated_at: expenseDate
      });
    }

    return expenses;
  }

  /**
   * Generate expense items (for OCR scanned expenses)
   */
  private static generateExpenseItems(expenses: SeedExpense[], itemRatio: number): SeedExpenseItem[] {
    const expenseItems: SeedExpenseItem[] = [];
    const scannedExpenses = expenses.filter(e => e.type === 'scan');

    scannedExpenses.forEach(expense => {
      const itemCount = 2 + Math.floor(Math.random() * 6); // 2-7 items
      const categories = ['vegetarian', 'non-vegetarian', 'other'];
      let remainingAmount = expense.amount;

      for (let i = 0; i < itemCount - 1; i++) {
        const maxItemPrice = remainingAmount * 0.6;
        const price = Math.round(50 + Math.random() * maxItemPrice);
        const quantity = Math.random() > 0.7 ? 1 + Math.floor(Math.random() * 3) : 1;

        expenseItems.push({
          id: uuidv4(),
          expense_id: expense.id,
          name: `Item ${i + 1}`,
          price: price,
          quantity: quantity,
          category: categories[Math.floor(Math.random() * categories.length)] as any,
          created_at: expense.created_at
        });

        remainingAmount -= price * quantity;
      }

      // Add last item with remaining amount
      if (remainingAmount > 0) {
        expenseItems.push({
          id: uuidv4(),
          expense_id: expense.id,
          name: `Item ${itemCount}`,
          price: remainingAmount,
          quantity: 1,
          category: categories[Math.floor(Math.random() * categories.length)] as any,
          created_at: expense.created_at
        });
      }
    });

    return expenseItems;
  }

  /**
   * Generate expense splits
   */
  private static generateExpenseSplits(expenses: SeedExpense[], groupMembers: SeedGroupMember[]): SeedExpenseSplit[] {
    const expenseSplits: SeedExpenseSplit[] = [];

    expenses.forEach(expense => {
      const members = this.getGroupMembers(expense.group_id);
      const payerIndex = members.findIndex(m => m.user_id === expense.paid_by);

      if (payerIndex === -1) return;

      const payer = members[payerIndex];
      const otherMembers = members.filter(m => m.user_id !== expense.paid_by);

      if (otherMembers.length === 0) return;

      switch (expense.split_type) {
        case 'EQUAL':
          const equalAmount = expense.amount / members.length;
          members.forEach(member => {
            expenseSplits.push({
              id: uuidv4(),
              expense_id: expense.id,
              user_id: member.user_id,
              user_name: member.name,
              amount: equalAmount,
              percentage: 100 / members.length,
              settled: Math.random() > 0.9, // 10% already settled
              created_at: expense.created_at
            });
          });
          break;

        case 'PERCENTAGE':
          let remainingPercentage = 100;
          otherMembers.forEach((member, index) => {
            const percentage = index === otherMembers.length - 1
              ? remainingPercentage
              : Math.floor(Math.random() * (remainingPercentage * 0.6)) + 10;

            remainingPercentage -= percentage;
            const amount = (expense.amount * percentage) / 100;

            expenseSplits.push({
              id: uuidv4(),
              expense_id: expense.id,
              user_id: member.user_id,
              user_name: member.name,
              amount: amount,
              percentage: percentage,
              settled: Math.random() > 0.9,
              created_at: expense.created_at
            });
          });
          break;

        case 'EXACT':
          let remainingAmount = expense.amount;
          otherMembers.forEach((member, index) => {
            const maxAmount = remainingAmount * 0.7;
            const amount = index === otherMembers.length - 1
              ? remainingAmount
              : Math.round(100 + Math.random() * maxAmount);

            remainingAmount -= amount;

            expenseSplits.push({
              id: uuidv4(),
              expense_id: expense.id,
              user_id: member.user_id,
              user_name: member.name,
              amount: amount,
              percentage: (amount / expense.amount) * 100,
              settled: Math.random() > 0.9,
              created_at: expense.created_at
            });
          });
          break;
      }
    });

    return expenseSplits;
  }

  /**
   * Helper to get group members
   */
  private static groupMembersCache: SeedGroupMember[] = [];
  private static getGroupMembers(groupId: string): SeedGroupMember[] {
    if (this.groupMembersCache.length === 0) {
      // This would be populated when we generate the full dataset
      // For now, return empty array - this will be handled properly in the actual seeding
      return [];
    }
    return this.groupMembersCache.filter(m => m.group_id === groupId);
  }

  /**
   * Generate random date within range
   */
  private static generateRandomDate(start: Date, end: Date): string {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
      .toISOString()
      .split('T')[0];
  }

  /**
   * Generate SQL insert statements
   */
  static generateSQLInserts(): string {
    const data = this.generateSeedData();
    let sql = '';

    // Insert users
    sql += '-- Insert Users\n';
    data.users.forEach(user => {
      sql += `INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.created_at}', '${user.updated_at}');\n`;
    });

    // Insert groups
    sql += '\n-- Insert Groups\n';
    data.groups.forEach(group => {
      sql += `INSERT INTO groups (id, name, description, type, created_by, total_expenses, created_at, updated_at) VALUES ('${group.id}', '${group.name}', '${group.description}', '${group.type}', '${group.created_by}', ${group.total_expenses}, '${group.created_at}', '${group.updated_at}');\n`;
    });

    // Insert group members
    sql += '\n-- Insert Group Members\n';
    data.groupMembers.forEach(member => {
      sql += `INSERT INTO group_members (id, group_id, user_id, name, email, dietary, balance, joined_at) VALUES ('${member.id}', '${member.group_id}', ${member.user_id ? `'${member.user_id}'` : 'NULL'}, '${member.name}', '${member.email}', '${member.dietary}', ${member.balance}, '${member.joined_at}');\n`;
    });

    // Insert expenses
    sql += '\n-- Insert Expenses\n';
    data.expenses.forEach(expense => {
      sql += `INSERT INTO expenses (id, description, amount, paid_by, paid_by_name, group_id, split_type, type, category, expense_date, currency, created_at, updated_at) VALUES ('${expense.id}', '${expense.description}', ${expense.amount}, '${expense.paid_by}', '${expense.paid_by_name}', '${expense.group_id}', '${expense.split_type}', '${expense.type}', '${expense.category}', '${expense.expense_date}', '${expense.currency}', '${expense.created_at}', '${expense.updated_at}');\n`;
    });

    // Insert expense items
    sql += '\n-- Insert Expense Items\n';
    data.expenseItems.forEach(item => {
      sql += `INSERT INTO expense_items (id, expense_id, name, price, quantity, category, created_at) VALUES ('${item.id}', '${item.expense_id}', '${item.name}', ${item.price}, ${item.quantity}, '${item.category}', '${item.created_at}');\n`;
    });

    // Insert expense splits
    sql += '\n-- Insert Expense Splits\n';
    data.expenseSplits.forEach(split => {
      sql += `INSERT INTO expense_splits (id, expense_id, user_id, user_name, amount, percentage, settled, created_at) VALUES ('${split.id}', '${split.expense_id}', ${split.user_id ? `'${split.user_id}'` : 'NULL'}, '${split.user_name}', ${split.amount}, ${split.percentage}, ${split.settled}, '${split.created_at}');\n`;
    });

    return sql;
  }

  /**
   * Generate JSON data for local storage
   */
  static generateJSONData(): string {
    const data = this.generateSeedData();
    return JSON.stringify(data, null, 2);
  }
}

// Export for use in scripts
if (require.main === module) {
  console.log('=== Database Seed Data ===');
  console.log('\n--- SQL Inserts ---');
  console.log(DatabaseSeeder.generateSQLInserts());

  console.log('\n--- JSON Data ---');
  console.log(DatabaseSeeder.generateJSONData());
}