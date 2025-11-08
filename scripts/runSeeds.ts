/**
 * Database Seeding Runner Script
 * Executes the seeding process for both Supabase and local storage
 */

import { DatabaseSeeder } from './seedDatabase';
import { database } from '../src/config/database';
import { SupabaseService } from '../src/services/SupabaseService';

export class SeedRunner {
  /**
   * Seed Supabase database
   */
  static async seedSupabase(): Promise<void> {
    try {
      console.log('🌱 Starting Supabase database seeding...');

      const data = DatabaseSeeder.generateSeedData();
      const client = SupabaseService.getClient();

      // Clear existing data (in reverse order of foreign key dependencies)
      console.log('🗑️  Clearing existing data...');
      await client.from('expense_splits').delete().neq('id', '');
      await client.from('expense_items').delete().neq('id', '');
      await client.from('expenses').delete().neq('id', '');
      await client.from('group_members').delete().neq('id', '');
      await client.from('groups').delete().neq('id', '');
      await client.from('users').delete().neq('id', '');

      // Insert users
      console.log(`👤 Inserting ${data.users.length} users...`);
      const { error: usersError } = await client.from('users').insert(data.users);
      if (usersError) throw usersError;

      // Insert groups
      console.log(`👥 Inserting ${data.groups.length} groups...`);
      const { error: groupsError } = await client.from('groups').insert(data.groups);
      if (groupsError) throw groupsError;

      // Insert group members
      console.log(`🔗 Inserting ${data.groupMembers.length} group members...`);
      const { error: membersError } = await client.from('group_members').insert(data.groupMembers);
      if (membersError) throw membersError;

      // Insert expenses
      console.log(`💰 Inserting ${data.expenses.length} expenses...`);
      const { error: expensesError } = await client.from('expenses').insert(data.expenses);
      if (expensesError) throw expensesError;

      // Insert expense items
      console.log(`📋 Inserting ${data.expenseItems.length} expense items...`);
      if (data.expenseItems.length > 0) {
        const { error: itemsError } = await client.from('expense_items').insert(data.expenseItems);
        if (itemsError) throw itemsError;
      }

      // Insert expense splits
      console.log(`💸 Inserting ${data.expenseSplits.length} expense splits...`);
      const { error: splitsError } = await client.from('expense_splits').insert(data.expenseSplits);
      if (splitsError) throw splitsError;

      console.log('✅ Supabase database seeded successfully!');

      // Print summary
      console.log('\n📊 Seeding Summary:');
      console.log(`   Users: ${data.users.length}`);
      console.log(`   Groups: ${data.groups.length}`);
      console.log(`   Group Members: ${data.groupMembers.length}`);
      console.log(`   Expenses: ${data.expenses.length}`);
      console.log(`   Expense Items: ${data.expenseItems.length}`);
      console.log(`   Expense Splits: ${data.expenseSplits.length}`);

    } catch (error) {
      console.error('❌ Failed to seed Supabase database:', error);
      throw error;
    }
  }

  /**
   * Seed local storage database
   */
  static async seedLocalStorage(): Promise<void> {
    try {
      console.log('🌱 Starting local storage seeding...');

      const data = DatabaseSeeder.generateSeedData();

      // Clear existing data
      console.log('🗑️  Clearing existing local data...');
      await database.clearAll();

      // Insert groups
      console.log(`👥 Inserting ${data.groups.length} groups...`);
      for (const group of data.groups) {
        // Transform group data to match local storage format
        const groupMembers = data.groupMembers.filter(m => m.group_id === group.id);
        const localGroup = {
          ...group,
          members: groupMembers.map(m => ({
            userId: m.user_id,
            name: m.name,
            email: m.email,
            dietary: m.dietary,
            balance: m.balance
          })),
          createdAt: group.created_at,
          updatedAt: group.updated_at
        };
        await database.createGroup(localGroup);
      }

      // Insert expenses
      console.log(`💰 Inserting ${data.expenses.length} expenses...`);
      for (const expense of data.expenses) {
        // Transform expense data to match local storage format
        const expenseSplits = data.expenseSplits.filter(s => s.expense_id === expense.id);
        const expenseItems = data.expenseItems.filter(i => i.expense_id === expense.id);

        const localExpense = {
          ...expense,
          groupId: expense.group_id,
          paidBy: expense.paid_by,
          paidByName: expense.paid_by_name,
          splitType: expense.split_type,
          expenseDate: expense.expense_date,
          createdAt: expense.created_at,
          updatedAt: expense.updated_at,
          splits: expenseSplits.map(s => ({
            userId: s.user_id,
            userName: s.user_name,
            amount: s.amount,
            percentage: s.percentage,
            settled: s.settled
          })),
          items: expenseItems.map(i => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            category: i.category
          }))
        };
        await database.createExpense(localExpense);
      }

      console.log('✅ Local storage seeded successfully!');

    } catch (error) {
      console.error('❌ Failed to seed local storage:', error);
      throw error;
    }
  }

  /**
   * Generate seed data file
   */
  static generateSeedFile(outputPath: string = './seed-data.json'): void {
    try {
      console.log('📝 Generating seed data file...');

      const jsonData = DatabaseSeeder.generateJSONData();

      if (typeof window !== 'undefined' && window.document) {
        // Browser environment - create download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seed-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Node.js environment - write to file
        const fs = require('fs');
        fs.writeFileSync(outputPath, jsonData);
      }

      console.log(`✅ Seed data file generated: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to generate seed file:', error);
      throw error;
    }
  }

  /**
   * Generate SQL file
   */
  static generateSQLFile(outputPath: string = './seed-data.sql'): void {
    try {
      console.log('📝 Generating SQL seed file...');

      const sqlData = DatabaseSeeder.generateSQLInserts();

      if (typeof window !== 'undefined' && window.document) {
        // Browser environment - create download
        const blob = new Blob([sqlData], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seed-data.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Node.js environment - write to file
        const fs = require('fs');
        fs.writeFileSync(outputPath, sqlData);
      }

      console.log(`✅ SQL seed file generated: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to generate SQL file:', error);
      throw error;
    }
  }

  /**
   * Run all seeding operations
   */
  static async runAll(): Promise<void> {
    console.log('🚀 Starting complete database seeding process...\n');

    try {
      // Generate files first
      this.generateSeedFile('./data/seed-data.json');
      this.generateSQLFile('./data/seed-data.sql');

      // Seed databases (if available)
      try {
        await this.seedSupabase();
      } catch (error) {
        console.warn('⚠️  Could not seed Supabase (might not be configured):', error instanceof Error ? error.message : error);
      }

      try {
        await this.seedLocalStorage();
      } catch (error) {
        console.warn('⚠️  Could not seed local storage:', error instanceof Error ? error.message : error);
      }

      console.log('\n🎉 Database seeding process completed!');

    } catch (error) {
      console.error('\n💥 Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Create minimal test data
   */
  static async createMinimalTestData(): Promise<void> {
    console.log('🌱 Creating minimal test data...');

    const minimalData = {
      users: [
        {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      groups: [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Group for testing',
          type: 'general' as const,
          created_by: 'user-1',
          total_expenses: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      groupMembers: [
        {
          id: 'member-1',
          group_id: 'group-1',
          user_id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          dietary: 'both' as const,
          balance: 0,
          joined_at: new Date().toISOString()
        }
      ],
      expenses: [
        {
          id: 'expense-1',
          description: 'Test Expense',
          amount: 100,
          paid_by: 'user-1',
          paid_by_name: 'Test User',
          group_id: 'group-1',
          split_type: 'EQUAL' as const,
          type: 'manual' as const,
          category: 'other',
          expense_date: new Date().toISOString().split('T')[0],
          currency: 'INR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      expenseItems: [],
      expenseSplits: [
        {
          id: 'split-1',
          expense_id: 'expense-1',
          user_id: 'user-1',
          user_name: 'Test User',
          amount: 100,
          percentage: 100,
          settled: false,
          created_at: new Date().toISOString()
        }
      ]
    };

    try {
      await database.clearAll();

      // Insert group
      await database.createGroup({
        ...minimalData.groups[0],
        members: [{
          userId: minimalData.groupMembers[0].user_id,
          name: minimalData.groupMembers[0].name,
          email: minimalData.groupMembers[0].email,
          dietary: minimalData.groupMembers[0].dietary,
          balance: minimalData.groupMembers[0].balance
        }]
      });

      // Insert expense
      await database.createExpense({
        ...minimalData.expenses[0],
        groupId: minimalData.expenses[0].group_id,
        paidBy: minimalData.expenses[0].paid_by,
        paidByName: minimalData.expenses[0].paid_by_name,
        splitType: minimalData.expenses[0].split_type,
        expenseDate: minimalData.expenses[0].expense_date,
        splits: minimalData.expenseSplits.map(s => ({
          userId: s.user_id,
          userName: s.user_name,
          amount: s.amount,
          percentage: s.percentage,
          settled: s.settled
        }))
      });

      console.log('✅ Minimal test data created successfully!');
    } catch (error) {
      console.error('❌ Failed to create minimal test data:', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'supabase':
      SeedRunner.seedSupabase().catch(console.error);
      break;
    case 'local':
      SeedRunner.seedLocalStorage().catch(console.error);
      break;
    case 'all':
      SeedRunner.runAll().catch(console.error);
      break;
    case 'minimal':
      SeedRunner.createMinimalTestData().catch(console.error);
      break;
    case 'json':
      SeedRunner.generateSeedFile();
      break;
    case 'sql':
      SeedRunner.generateSQLFile();
      break;
    default:
      console.log('Usage: npm run seed [command]');
      console.log('Commands:');
      console.log('  supabase - Seed Supabase database');
      console.log('  local    - Seed local storage');
      console.log('  all      - Seed both databases and generate files');
      console.log('  minimal  - Create minimal test data');
      console.log('  json     - Generate JSON seed file');
      console.log('  sql      - Generate SQL seed file');
  }
}