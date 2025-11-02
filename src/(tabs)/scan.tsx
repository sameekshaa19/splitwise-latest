import React, { useState } from 'react';
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
} from 'react-native';
import { Camera, Upload, X, Check, CreditCard as Edit3, Users, Utensils } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { router } from 'expo-router';

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

const mockMembers: GroupMember[] = [
  { id: '1', name: 'You', dietary: 'both' },
  { id: '2', name: 'Alex', dietary: 'vegetarian' },
  { id: '3', name: 'Sam', dietary: 'non-vegetarian' },
  { id: '4', name: 'Jordan', dietary: 'both' },
];

export default function ScanScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
  const [selectedGroup] = useState('Weekend Trip');
  const [members, setMembers] = useState<GroupMember[]>(mockMembers);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editMember, setEditMember] = useState<GroupMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberDietary, setMemberDietary] = useState<GroupMember['dietary']>('both');
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');

  // Mock OCR processing
  const mockScanResults: ScannedItem[] = [
    {
      id: '1',
      name: 'Caesar Salad',
      price: 14.99,
      category: 'vegetarian',
      assignedTo: ['2'],
    },
    {
      id: '2',
      name: 'Grilled Chicken',
      price: 22.99,
      category: 'non-vegetarian',
      assignedTo: ['1', '3'],
    },
    {
      id: '3',
      name: 'Garlic Bread',
      price: 8.99,
      category: 'vegetarian',
      assignedTo: ['1', '2', '3', '4'],
    },
    {
      id: '4',
      name: 'Wine (Bottle)',
      price: 28.99,
      category: 'other',
      assignedTo: ['1', '3', '4'],
    },
  ];

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
    if (!result.canceled) {
      // In a real app, run OCR here. For now, simulate results.
      setScannedItems(mockScanResults);
      Alert.alert('Photo selected', 'Simulated scan has been added.');
    }
  };

  const processScan = () => {
    // Simulate OCR processing
    setShowCamera(false);
    setScannedItems(mockScanResults);
    Alert.alert('Success!', 'Bill scanned successfully. Please review and assign items.');
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

  const saveMember = () => {
    const name = memberName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a member name.');
      return;
    }
    if (editMember) {
      setMembers(prev => prev.map(m => (m.id === editMember.id ? { ...m, name, dietary: memberDietary } : m)));
    } else {
      const newMember: GroupMember = {
        id: Date.now().toString(),
        name,
        dietary: memberDietary,
      };
      setMembers(prev => [newMember, ...prev]);
    }
    setShowMembersModal(false);
  };

  const saveAndSplit = () => {
    if (scannedItems.length === 0) {
      Alert.alert('Nothing to save', 'Please scan or upload a bill first.');
      return;
    }
    Alert.alert('Saved', 'Your scanned items were saved. Proceed to add details.', [
      { text: 'OK', onPress: () => router.push('/add-expense') },
    ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Split</Text>
        <Text style={styles.headerSubtitle}>Group: {selectedGroup}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.manageMembersBtn} onPress={openMembersModalToAdd}>
            <Users size={16} color={theme.colors.primaryBg} />
            <Text style={styles.manageMembersText}>Manage Members</Text>
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

            <TouchableOpacity style={styles.manualButton}>
              <Edit3 size={20} color="#6B7280" />
              <Text style={styles.manualButtonText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannedContent}>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Scanned Items</Text>
              <Text style={styles.summaryAmount}>₹{getTotalAmount().toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                {scannedItems.length} items • {members.length} people
              </Text>
            </View>

            {/* Items List */}
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

            {/* Member Shares */}
            <View style={styles.sharesCard}>
              <Text style={styles.sharesTitle}>Individual Shares</Text>
              {members.map((member) => (
                <View key={member.id} style={styles.shareRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberShare}>
                    ₹{getMemberShare(member.id).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveButton} onPress={saveAndSplit}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save & Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Item Edit Modal */}
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

      {/* Manage Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMember ? 'Edit Member' : 'Add Member'}</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Alex"
                  value={memberName}
                  onChangeText={setMemberName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dietary Preference</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['vegetarian','non-vegetarian','both'] as const).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.memberChip, memberDietary === opt && styles.memberChipActive]}
                      onPress={() => setMemberDietary(opt)}
                    >
                      <Text style={[styles.memberChipText, memberDietary === opt && styles.memberChipTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Existing members for quick edit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Existing Members</Text>
                <View style={styles.membersList}>
                  {members.map(m => (
                    <TouchableOpacity key={m.id} style={styles.memberChip} onPress={() => openMembersModalToEdit(m)}>
                      <Text style={styles.memberChipText}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={saveMember}>
                <Text style={styles.modalSaveButtonText}>{editMember ? 'Save Member' : 'Add Member'}</Text>
              </TouchableOpacity>
            </View>
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
});
