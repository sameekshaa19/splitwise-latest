import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Plus, Users, MapPin, Calendar, IndianRupee, MoveVertical as MoreVertical, X, CreditCard as Edit3, Trash2, UserPlus } from 'lucide-react-native';
import { theme } from '../styles/theme';

interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  totalExpenses: number;
  createdAt: string;
  type: 'trip' | 'meal' | 'event' | 'general';
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  dietary: 'vegetarian' | 'non-vegetarian' | 'both';
  balance: number;
}

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Weekend Trip',
    description: 'Mountain cabin getaway',
    members: [
      { id: '1', name: 'You', email: 'you@email.com', dietary: 'both', balance: -25.50 },
      { id: '2', name: 'Alex', email: 'alex@email.com', dietary: 'vegetarian', balance: 15.75 },
      { id: '3', name: 'Sam', email: 'sam@email.com', dietary: 'non-vegetarian', balance: 8.25 },
      { id: '4', name: 'Jordan', email: 'jordan@email.com', dietary: 'both', balance: 1.50 },
    ],
    totalExpenses: 385.50,
    createdAt: '2025-01-08',
    type: 'trip',
  },
  {
    id: '2',
    name: 'Office Team',
    description: 'Weekly team lunches',
    members: [
      { id: '1', name: 'You', email: 'you@email.com', dietary: 'both', balance: 12.50 },
      { id: '5', name: 'Emma', email: 'emma@email.com', dietary: 'vegetarian', balance: -8.25 },
      { id: '6', name: 'Mike', email: 'mike@email.com', dietary: 'non-vegetarian', balance: -4.25 },
    ],
    totalExpenses: 156.80,
    createdAt: '2025-01-05',
    type: 'meal',
  },
  {
    id: '3',
    name: 'Birthday Party',
    description: "Sarah's surprise party",
    members: [
      { id: '1', name: 'You', email: 'you@email.com', dietary: 'both', balance: 0 },
      { id: '7', name: 'Lisa', email: 'lisa@email.com', dietary: 'vegetarian', balance: -45.00 },
      { id: '8', name: 'Tom', email: 'tom@email.com', dietary: 'both', balance: 22.50 },
      { id: '9', name: 'Kate', email: 'kate@email.com', dietary: 'vegetarian', balance: 22.50 },
    ],
    totalExpenses: 240.00,
    createdAt: '2025-01-03',
    type: 'event',
  },
];

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return <MapPin size={20} color="#10B981" />;
      case 'meal':
        return <Users size={20} color="#3B82F6" />;
      case 'event':
        return <Calendar size={20} color="#F97316" />;
      default:
        return <Users size={20} color="#6B7280" />;
    }
  };

  const createGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDescription,
      members: [
        { id: '1', name: 'You', email: 'you@email.com', dietary: 'both', balance: 0 },
      ],
      totalExpenses: 0,
      createdAt: new Date().toISOString().split('T')[0],
      type: 'general',
    };

    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowCreateModal(false);
  };

  const getTotalBalance = (members: GroupMember[]) => {
    return members.reduce((sum, member) => sum + member.balance, 0);
  };

  const getPositiveBalance = (members: GroupMember[]) => {
    return members.reduce((sum, member) => sum + (member.balance > 0 ? member.balance : 0), 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={theme.colors.primaryBg} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => setShowGroupDetails(group)}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupIconContainer}>
                  {getGroupIcon(group.type)}
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                  <Text style={styles.groupMembers}>
                    {group.members.length} members • ₹{group.totalExpenses.toFixed(2)} total
                  </Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceSection}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>You owe</Text>
                  <Text style={styles.balanceAmountNegative}>
                    ₹{Math.abs(Math.min(0, group.members[0]?.balance || 0)).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>You're owed</Text>
                  <Text style={styles.balanceAmountPositive}>
                    ₹{Math.max(0, group.members[0]?.balance || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first group to start splitting expenses
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.createForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Group Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="e.g., Weekend Trip, Office Team"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newGroupDescription}
                  onChangeText={setNewGroupDescription}
                  placeholder="Brief description of the group"
                />
              </View>

              <TouchableOpacity style={styles.createButton} onPress={createGroup}>
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Details Modal */}
      <Modal
        visible={!!showGroupDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGroupDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showGroupDetails?.name}</Text>
              <TouchableOpacity onPress={() => setShowGroupDetails(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {showGroupDetails && (
              <ScrollView style={styles.detailsContent}>
                <View style={styles.groupStats}>
                  <View style={styles.statCard}>
                    <IndianRupee size={20} color={theme.colors.accent} />
                    <Text style={styles.statValue}>
                      ₹{showGroupDetails.totalExpenses.toFixed(2)}
                    </Text>
                    <Text style={styles.statLabel}>Total Expenses</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Users size={20} color={theme.colors.secondary} />
                    <Text style={styles.statValue}>{showGroupDetails.members.length}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                </View>

                <View style={styles.membersSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <TouchableOpacity style={styles.addMemberButton}>
                      <UserPlus size={16} color="#10B981" />
                      <Text style={styles.addMemberText}>Add Member</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.membersList}>
                    {showGroupDetails.members.map((member) => (
                      <View key={member.id} style={styles.memberCard}>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          <View style={styles.dietaryBadge}>
                            <Text style={styles.dietaryText}>
                              {member.dietary === 'both' ? 'All' : member.dietary}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.memberBalance}>
                          <Text
                            style={[
                              styles.balanceAmount,
                              member.balance >= 0
                                ? styles.positiveBalance
                                : styles.negativeBalance,
                            ]}
                          >
                            {member.balance >= 0 ? '+' : ''}₹{member.balance.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.groupActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Edit3 size={18} color="#6B7280" />
                    <Text style={styles.actionButtonText}>Edit Group</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.dangerText]}>
                      Delete Group
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.primaryBg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
  },
  addButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  groupsList: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  moreButton: {
    padding: 4,
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.accent,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  balanceAmountPositive: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.fontFamily,
  },
  balanceAmountNegative: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.lightBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  detailsModal: {
    backgroundColor: theme.colors.lightBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  createForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.lightBg,
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  detailsContent: {
    flex: 1,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.lightBg,
  },
  addMemberText: {
    fontSize: 12,
    color: theme.colors.primaryBg,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  dietaryBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dietaryText: {
    fontSize: 10,
    color: theme.colors.primaryBg,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  memberBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveBalance: {
    color: theme.colors.accent,
  },
  negativeBalance: {
    color: theme.colors.secondary,
  },
  groupActions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.lightBg,
  },
  dangerButton: {
    backgroundColor: theme.colors.lightBg,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.text.muted,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  dangerText: {
    color: theme.colors.secondary,
  },
});
