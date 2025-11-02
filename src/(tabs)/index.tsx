import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus,
  Receipt,
  Users,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { theme } from '../styles/theme';

interface Expense {
  id: string;
  title: string;
  amount: number;
  group: string;
  date: string;
  type: 'scan' | 'manual';
  yourShare: number;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Dinner at Olive Garden',
    amount: 127.50,
    group: 'Weekend Trip',
    date: '2025-01-10',
    type: 'scan',
    yourShare: 31.88,
  },
  {
    id: '2',
    title: 'Uber to Airport',
    amount: 45.00,
    group: 'Weekend Trip',
    date: '2025-01-10',
    type: 'manual',
    yourShare: 11.25,
  },
  {
    id: '3',
    title: 'Coffee Shop',
    amount: 24.80,
    group: 'Office Team',
    date: '2025-01-09',
    type: 'scan',
    yourShare: 6.20,
  },
];

export default function Dashboard() {
  const [expenses] = useState<Expense[]>(mockExpenses);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const yourTotal = expenses.reduce((sum, exp) => sum + exp.yourShare, 0);
  const balance = yourTotal - (totalExpenses - yourTotal) / 3; // Simplified calculation

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Splitwise</Text>
        <Text style={styles.headerSubtitle}>Smart Expense Splitting</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.totalCard]}>
            <View style={styles.summaryHeader}>
              <IndianRupee size={24} color={theme.text.onLight} />
              <Text style={styles.summaryLabel}>Total Expenses</Text>
            </View>
            <Text style={styles.summaryAmount}>₹{totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.smallCard, styles.positiveCard]}>
              <ArrowUpRight size={16} color={theme.colors.accent} />
              <Text style={styles.smallCardLabel}>You're Owed</Text>
              <Text style={styles.smallCardAmount}>
                ₹{balance > 0 ? balance.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.smallCard, styles.negativeCard]}>
              <ArrowDownRight size={16} color={theme.colors.secondary} />
              <Text style={styles.smallCardLabel}>You Owe</Text>
              <Text style={styles.smallCardAmount}>
                ₹{balance < 0 ? Math.abs(balance).toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push('/add-expense')}
          >
            <Plus size={20} color={theme.text.onPrimary} />
            <Text style={styles.primaryActionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
            <Receipt size={20} color={theme.colors.primaryBg} />
            <Text style={styles.secondaryActionText}>Scan Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.expensesList}>
            {expenses.map((expense) => (
              <TouchableOpacity key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseIcon}>
                  {expense.type === 'scan' ? (
                    <Receipt size={20} color={theme.colors.accent} />
                  ) : (
                    <IndianRupee size={20} color={theme.colors.secondary} />
                  )}
                </View>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseGroup}>{expense.group}</Text>
                  <Text style={styles.expenseDate}>{expense.date}</Text>
                </View>
                <View style={styles.expenseAmounts}>
                  <Text style={styles.totalAmount}>₹{expense.amount.toFixed(2)}</Text>
                  <Text style={styles.yourShare}>Your share: ₹{expense.yourShare.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Preview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <TrendingUp size={18} color={theme.colors.accent} />
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={18} color={theme.colors.secondary} />
              <Text style={styles.statLabel}>Groups</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
            <View style={styles.statItem}>
              <Receipt size={18} color={theme.colors.accent} />
              <Text style={styles.statLabel}>Scanned</Text>
              <Text style={styles.statValue}>8</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryBg,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.primaryBg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text.onPrimary,
    marginBottom: 4,
    fontFamily: theme.fontFamily,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.text.muted,
    fontWeight: '400',
    fontFamily: theme.fontFamily,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.text.onLight,
    marginLeft: 8,
    fontWeight: '500',
    fontFamily: theme.fontFamily,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    padding: 16,
  },
  positiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  negativeCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  smallCardLabel: {
    fontSize: 12,
    color: theme.text.muted,
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: theme.fontFamily,
  },
  smallCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: theme.colors.accent,
  },
  secondaryAction: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  primaryActionText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  secondaryActionText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  expensesList: {
    gap: 12,
  },
  expenseCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 2,
  },
  expenseGroup: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  expenseAmounts: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 2,
  },
  yourShare: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  statsContainer: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
});
