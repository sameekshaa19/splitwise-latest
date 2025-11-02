import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ExpenseService } from '../services/ExpenseService';
import { GroupService } from '../services/GroupService';

const AddExpenseScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [loading, setLoading] = useState(false);

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Replace 'currentUserId' with the actual current user's ID
        const { data } = await GroupService.getUserGroups('currentUserId');
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, []);

  const handleAddExpense = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        amount: parseFloat(amount),
        description,
        paidBy: 'currentUserId', // Replace with actual user ID
        groupId: selectedGroup || null,
        splitType,
        split: [], // You'll need to implement the split logic based on the splitType
      };

      const result = await ExpenseService.createExpense(expenseData);
      
      if (result.success) {
        Alert.alert('Success', 'Expense added successfully!');
        navigation.goBack();
      } else {
        throw new Error(result.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What was this expense for?"
      />

      <Text style={styles.label}>Group (Optional)</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedGroup}
          onValueChange={(itemValue) => setSelectedGroup(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="No Group" value="" />
          {groups.map((group) => (
            <Picker.Item key={group._id} label={group.name} value={group._id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Split Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={splitType}
          onValueChange={(itemValue) => setSplitType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Equal" value="EQUAL" />
          <Picker.Item label="By Percentage" value="PERCENTAGE" />
          <Picker.Item label="Exact Amounts" value="EXACT" />
        </Picker>
      </View>

      {/* You can add more fields here for split details based on the splitType */}

      <Button
        title={loading ? 'Adding...' : 'Add Expense'}
        onPress={handleAddExpense}
        disabled={loading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    width: '100%',
  },
});

export default AddExpenseScreen;
