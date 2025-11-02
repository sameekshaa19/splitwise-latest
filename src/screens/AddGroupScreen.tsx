import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { GroupService } from '../services/GroupService';

const AddGroupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([{ email: '' }]);

  const handleAddMember = () => {
    setMembers([...members, { email: '' }]);
  };

  const handleMemberEmailChange = (text: string, index: number) => {
    const newMembers = [...members];
    newMembers[index].email = text;
    setMembers(newMembers);
  };

  const handleCreateGroup = async () => {
    if (!name) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setLoading(true);
    try {
      const groupData = {
        name,
        description,
        createdBy: 'currentUserId', // Replace with actual user ID
        members: [
          {
            userId: 'currentUserId', // Replace with actual user ID
            name: 'Current User', // Replace with actual user name
            email: 'current@example.com', // Replace with actual user email
            joinedAt: new Date(),
          },
          // Add other members here if needed
        ],
      };

      const result = await GroupService.createGroup(groupData);
      
      if (result.success) {
        Alert.alert('Success', 'Group created successfully!');
        navigation.goBack();
      } else {
        throw new Error(result.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Group Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter group name"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter group description (optional)"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Add Members</Text>
      {members.map((member, index) => (
        <View key={index} style={styles.memberInputContainer}>
          <TextInput
            style={[styles.input, styles.memberInput]}
            value={member.email}
            onChangeText={(text) => handleMemberEmailChange(text, index)}
            placeholder="Member email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      ))}

      <Button title="+ Add Another Member" onPress={handleAddMember} />

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Creating...' : 'Create Group'}
          onPress={handleCreateGroup}
          disabled={loading}
        />
      </View>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  memberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInput: {
    flex: 1,
    marginRight: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
});

export default AddGroupScreen;
