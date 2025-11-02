import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { IndianRupee, Calendar, Users, FileText, Check, X } from 'lucide-react-native';
import { theme } from './styles/theme';

export default function AddExpense() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [group, setGroup] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const onSave = () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Missing info', 'Please enter a title and an amount.');
      return;
    }
    // In a real app, dispatch to context/store or call API here
    Alert.alert('Expense Added', `${title} • ₹${Number(amount).toFixed(2)}`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <X size={22} color={theme.text.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <View style={styles.inputRow}>
              <FileText size={18} color={theme.text.muted} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Dinner at Olive Garden"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.rowGap} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₹)</Text>
            <View style={styles.inputRow}>
              <IndianRupee size={18} color={theme.text.muted} />
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.rowGap} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group (optional)</Text>
            <View style={styles.inputRow}>
              <Users size={18} color={theme.text.muted} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Weekend Trip"
                value={group}
                onChangeText={setGroup}
              />
            </View>
          </View>

          <View style={styles.rowGap} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputRow}>
              <Calendar size={18} color={theme.text.muted} />
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.secondary]} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.primary]} onPress={onSave}>
            <Check size={18} color={theme.colors.primaryBg} />
            <Text style={styles.primaryText}>Save</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.primaryBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
  },
  headerClose: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: theme.text.muted,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.lightBg,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  rowGap: { height: 14 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primary: { backgroundColor: theme.colors.accent },
  primaryText: { color: theme.colors.primaryBg, fontSize: 16, fontWeight: '700', fontFamily: theme.fontFamily },
  secondary: { backgroundColor: theme.colors.lightBg, borderWidth: 1, borderColor: theme.colors.accent },
  secondaryText: { color: theme.colors.primaryBg, fontSize: 16, fontWeight: '700', fontFamily: theme.fontFamily },
});
