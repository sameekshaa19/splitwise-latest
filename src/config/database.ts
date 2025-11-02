import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Simple in-memory storage with AsyncStorage/LocalStorage persistence
class Database {
  private static instance: Database;
  private expenses: any[] = [];
  private groups: any[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async getStorageItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  }

  private async setStorageItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  public async init() {
    if (this.initialized) return;
    
    // Only skip initialization during SSR (not for native clients)
    // On native, Platform.OS will be 'ios' or 'android' and window may be defined
    const isSSR = typeof window === 'undefined' && Platform.OS === 'web';
    if (isSSR) {
      this.initialized = true;
      return;
    }
    
    try {
      const expensesData = await this.getStorageItem('@expenses');
      const groupsData = await this.getStorageItem('@groups');
      
      if (expensesData) this.expenses = JSON.parse(expensesData);
      if (groupsData) this.groups = JSON.parse(groupsData);
      
      this.initialized = true;
      console.log('Database initialized successfully:', { expenses: this.expenses.length, groups: this.groups.length });
    } catch (error) {
      console.error('Failed to initialize database', error);
      this.initialized = true;
    }
  }

  private async saveData() {
    // Only skip saving during SSR (not for native clients)
    const isSSR = typeof window === 'undefined' && Platform.OS === 'web';
    if (isSSR) return;
    
    try {
      await this.setStorageItem('@expenses', JSON.stringify(this.expenses));
      await this.setStorageItem('@groups', JSON.stringify(this.groups));
      console.log('Data saved successfully:', { expenses: this.expenses.length, groups: this.groups.length });
    } catch (error) {
      console.error('Failed to save data', error);
    }
  }

  // Expense methods
  public async createExpense(expense: any) {
    const newExpense = {
      ...expense,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.expenses.push(newExpense);
    await this.saveData();
    return newExpense;
  }

  public async getExpenses(groupId?: string) {
    if (groupId) {
      return this.expenses.filter(expense => expense.groupId === groupId);
    }
    return this.expenses;
  }

  // Group methods
  public async createGroup(group: any) {
    const newGroup = {
      ...group,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.groups.push(newGroup);
    await this.saveData();
    return newGroup;
  }

  public async getGroups(userId: string) {
    return this.groups.filter(group => 
      group.members.some((member: any) => member.userId === userId)
    );
  }

  // Clear all data (for testing)
  public async clearAll() {
    this.expenses = [];
    this.groups = [];
    
    const isSSR = typeof window === 'undefined' && Platform.OS === 'web';
    if (!isSSR) {
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    }
  }
}

// Create and initialize the database
const database = Database.getInstance();

// Initialize on client-side and native (but not during SSR)
const isSSR = typeof window === 'undefined' && Platform.OS === 'web';
if (!isSSR) {
  database.init();
}

export { database };
