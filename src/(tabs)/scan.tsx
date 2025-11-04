import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, Upload, X, Check, CreditCard as Edit3, Users, Utensils } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { router } from 'expo-router';
import { OCRService } from '../services/OCRService';
import { ExpenseService } from '../services/ExpenseService';
import { GroupService } from '../services/GroupService';
import { SupabaseService } from '../services/SupabaseService';

interface ScannedItem {
  id: string;
  name: string;
  price: number;
  category: 'vegetarian' | 'non-vegetarian' | 'other';
  assignedTo: string[];
}

interface GroupMember {
  id: string;
  name: string;
  dietary: 'vegetarian' | 'non-vegetarian' | 'both';
}

export default function ScanScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editMember, setEditMember] = useState<GroupMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberDietary, setMemberDietary] = useState<GroupMember['dietary']>('both');
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [loading, setLoading] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [showGroupSelect, setShowGroupSelect] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    const result = await GroupService.getUserGroups(SupabaseService.getCurrentUserId());
    if (result.success && result.data) {
      setGroups(result.data);
      if (result.data.length > 0) {
        setSelectedGroup(result.data[0]);
      }
    }
  };

  const loadGroupMembers = () => {
    if (selectedGroup?.group_members) {
      const mappedMembers = selectedGroup.group_members.map((m: any) => ({
        id: m.user_id || m.id,
        name: m.name,
        dietary: m.dietary || 'both',
      }));
      setMembers(mappedMembers);
    }
  };

  const handleScanBill = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const ocrResult = await OCRService.scanReceipt(imageUri);

      if (ocrResult.confidence < 0.5) {
        Alert.alert(
          'Low Confidence',
          'The scan quality is low. Please review and edit the items carefully.',
          [{ text: 'OK' }]
        );
      }

      setOcrData(ocrResult);

      const items: ScannedItem[] = ocrResult.items.map((item, index) => ({
        id: `item-${index}`,
        name: item.name,
        price: item.total,
        category: item.category || 'other',
        assignedTo: [],
      }));

      setScannedItems(items);
      setLoading(false);

      Alert.alert(
        'Scan Complete',
        `Found ${items.length} items. Total: ₹${ocrResult.total.toFixed(2)}. Please review and assign items to members.`
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Scan Failed', error.message || 'Could not process the image. Please try again or add items manually.');
    }
  };

  const processScan = async () => {
    setShowCamera(false);
    Alert.alert('Demo Mode', 'Camera scanning is in demo mode. Using mock data.');
    const mockResult = OCRService.mockScan();
    setOcrData(mockResult);

    const items: ScannedItem[] = mockResult.items.map((item, index) => ({
      id: `item-${index}`,
      name: item.name,
      price: item.total,
      category: item.category || 'other',
      assignedTo: [],
    }));

    setScannedItems(items);
  };

  const editItem = (item: ScannedItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const saveItem = (updatedItem: ScannedItem) => {
    setScannedItems(prev =>
      prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setShowItemModal(false);
    setEditingItem(null);
  };

  const toggleMemberAssignment = (itemId: string, memberId: string) => {
    setScannedItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newAssigned = item.assignedTo.includes(memberId)
            ? item.assignedTo.filter(id => id !== memberId)
            : [...item.assignedTo, memberId];
          return { ...item, assignedTo: newAssigned };
        }
        return item;
      })
    );
  };

  const getTotalAmount = () => {
    return scannedItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getMemberShare = (memberId: string) => {
    return scannedItems.reduce((sum, item) => {
      if (item.assignedTo.includes(memberId)) {
        return sum + item.price / item.assignedTo.length;
      }
      return sum;
    }, 0);
  };

  const saveAndSplit = async () => {
    if (scannedItems.length === 0) {
      Alert.alert('Nothing to save', 'Please scan or upload a bill first.');
      return;
    }

    if (!selectedGroup) {
      Alert.alert('No Group Selected', 'Please select a group first.');
      setShowGroupSelect(true);
      return;
    }

    const unassignedItems = scannedItems.filter(item => item.assignedTo.length === 0);
    if (unassignedItems.length > 0) {
      Alert.alert(
        'Unassigned Items',
        `${unassignedItems.length} items are not assigned to anyone. Assign them or continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performSave() },
        ]
      );
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setLoading(true);
    try {
      const currentUserId = SupabaseService.getCurrentUserId();
      const totalAmount = getTotalAmount();

      const splits = scannedItems.flatMap(item =>
        item.assignedTo.map(memberId => {
          const member = members.find(m => m.id === memberId);
          return {
            userId: memberId,
            userName: member?.name || 'Unknown',
            amount: item.price / item.assignedTo.length,
          };
        })
      );

      const expenseData = {
        description: ocrData?.vendor || 'Scanned Bill',
        amount: totalAmount,
        paidBy: currentUserId,
        paidByName: 'You',
        groupId: selectedGroup.id,
        splitType: 'ITEM_WISE' as const,
        type: 'scan' as const,
        ocrConfidence: ocrData?.confidence,
        vendor: ocrData?.vendor,
        expenseDate: ocrData?.date || new Date().toISOString().split('T')[0],
        tax: ocrData?.tax,
        currency: ocrData?.currency || 'INR',
        items: scannedItems.map(item => ({
          name: item.name,
          price: item.price,
          category: item.category,
        })),
        splits,
      };

      const result = await ExpenseService.createExpense(expenseData);

      setLoading(false);

      if (result.success) {
        Alert.alert('Success', 'Expense saved and split successfully!', [
          { text: 'OK', onPress: () => {
            setScannedItems([]);
            setOcrData(null);
            router.push('/');
          }},
        ]);
      } else {
        throw new Error(result.error || 'Failed to save expense');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to save expense. Please try again.');
    }
  };

  const openMembersModalToAdd = () => {
    setEditMember(null);
    setMemberName('');
    setMemberDietary('both');
    setShowMembersModal(true);
  };

  const openMembersModalToEdit = (m: GroupMember) => {
    setEditMember(m);
    setMemberName(m.name);
    setMemberDietary(m.dietary);
    setShowMembersModal(true);
  };

  const saveMember = async () => {
    const name = memberName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a member name.');
      return;
    }

    if (!selectedGroup) {
      Alert.alert('No Group', 'Please select a group first.');
      return;
    }

    setLoading(true);
    try {
      const result = await GroupService.addGroupMember(selectedGroup.id, {
        name,
        email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
        dietary: memberDietary,
      });

      if (result.success) {
        await loadGroups();
        setShowMembersModal(false);
        setLoading(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to add member');
    }
  };

  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scan Your Bill</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstruction}>
                Position the bill within the frame
              </Text>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={processScan}>
                <Camera size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Split</Text>
        <Text style={styles.headerSubtitle}>
          Group: {selectedGroup?.name || 'No group selected'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.manageMembersBtn}
            onPress={() => setShowGroupSelect(true)}
          >
            <Users size={16} color={theme.colors.primaryBg} />
            <Text style={styles.manageMembersText}>Select Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {scannedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.scanOptions}>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanBill}>
                <Camera size={32} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan Bill</Text>
                <Text style={styles.scanButtonSubtext}>Use camera to scan receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
                <Upload size={24} color={theme.colors.primaryBg} />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
                <Text style={styles.uploadButtonSubtext}>Choose from gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.orText}>or</Text>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.push('/add-expense')}
            >
              <Edit3 size={20} color="#6B7280" />
              <Text style={styles.manualButtonText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannedContent}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Scanned Items</Text>
              <Text style={styles.summaryAmount}>₹{getTotalAmount().toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                {scannedItems.length} items • {members.length} people
              </Text>
              {ocrData && (
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(ocrData.confidence * 100)}%
                </Text>
              )}
            </View>

            <View style={styles.itemsList}>
              {scannedItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => editItem(item)}
                    >
                      <Edit3 size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.categoryBadge}>
                    <Utensils size={12} color={theme.text.muted} />
                    <Text style={styles.categoryText}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.assignmentSection}>
                    <Text style={styles.assignmentLabel}>Assigned to:</Text>
                    <View style={styles.membersList}>
                      {members.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.memberChip,
                            item.assignedTo.includes(member.id) && styles.memberChipActive,
                          ]}
                          onPress={() => toggleMemberAssignment(item.id, member.id)}
                        >
                          <Text
                            style={[
                              styles.memberChipText,
                              item.assignedTo.includes(member.id) && styles.memberChipTextActive,
                            ]}
                          >
                            {member.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sharesCard}>
              <Text style={styles.sharesTitle}>Individual Shares</Text>
              {members.map((member) => {
                const share = getMemberShare(member.id);
                return (
                  <View key={member.id} style={styles.shareRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberShare}>₹{share.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveButton} onPress={saveAndSplit}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save & Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Item Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingItem.name}
                    onChangeText={(text) =>
                      setEditingItem({ ...editingItem, name: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingItem.price.toString()}
                    onChangeText={(text) =>
                      setEditingItem({ ...editingItem, price: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => saveItem(editingItem)}
                >
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGroupSelect}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGroupSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group</Text>
              <TouchableOpacity onPress={() => setShowGroupSelect(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.groupsList}>
              {groups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupItem,
                    selectedGroup?.id === group.id && styles.groupItemActive
                  ]}
                  onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupSelect(false);
                  }}
                >
                  <Text style={styles.groupItemName}>{group.name}</Text>
                  <Text style={styles.groupItemMembers}>
                    {group.group_members?.length || 0} members
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.primaryBg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.onPrimary,
    marginBottom: 4,
    fontFamily: theme.fontFamily,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  headerActions: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  manageMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageMembersText: {
    color: theme.colors.primaryBg,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  scanOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  scanButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  scanButtonSubtext: {
    color: theme.colors.primaryBg,
    fontSize: 14,
    opacity: 0.8,
    fontFamily: theme.fontFamily,
  },
  uploadButton: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  uploadButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  uploadButtonSubtext: {
    color: theme.text.muted,
    fontSize: 14,
    fontFamily: theme.fontFamily,
  },
  orText: {
    fontSize: 16,
    color: theme.text.muted,
    marginVertical: 24,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.lightBg,
  },
  manualButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedContent: {
    gap: 20,
  },
  summaryCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: theme.text.muted,
    marginBottom: 8,
    fontFamily: theme.fontFamily,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  confidenceText: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 8,
    fontFamily: theme.fontFamily,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    fontFamily: theme.fontFamily,
  },
  editButton: {
    padding: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.lightBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  assignmentSection: {
    gap: 8,
  },
  assignmentLabel: {
    fontSize: 14,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.lightBg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  memberChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  memberChipText: {
    fontSize: 12,
    color: theme.text.muted,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
  },
  memberChipTextActive: {
    color: theme.colors.primaryBg,
  },
  sharesCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sharesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 16,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  memberShare: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
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
  editForm: {
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
  modalSaveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: theme.colors.primaryBg,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  groupsList: {
    maxHeight: 400,
  },
  groupItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.lightBg,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupItemActive: {
    borderColor: theme.colors.accent,
  },
  groupItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  groupItemMembers: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
});
