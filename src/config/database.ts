import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple in-memory storage with AsyncStorage persistence
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

  public async init() {
    if (this.initialized) return;
    
    if (typeof window === 'undefined') {
      this.initialized = true;
      return;
    }
    
    try {
      const expensesData = await AsyncStorage.getItem('@expenses');
      const groupsData = await AsyncStorage.getItem('@groups');
      
      if (expensesData) this.expenses = JSON.parse(expensesData);
      if (groupsData) this.groups = JSON.parse(groupsData);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database', error);
    }
  }

  private async saveData() {
    if (typeof window === 'undefined') return;
    
    try {
      await AsyncStorage.setItem('@expenses', JSON.stringify(this.expenses));
      await AsyncStorage.setItem('@groups', JSON.stringify(this.groups));
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
    if (typeof window !== 'undefined') {
      await AsyncStorage.clear();
    }
  }
}

// Create and initialize the database
const database = Database.getInstance();

// Only initialize on client-side (not during SSR)
if (typeof window !== 'undefined') {
  database.init();
}

export { database };
