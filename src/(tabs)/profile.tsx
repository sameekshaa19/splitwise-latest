import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { User, Bell, CreditCard, FileText, Settings, CircleHelp as HelpCircle, Shield, LogOut, ChevronRight, Download, Share, Smartphone } from 'lucide-react-native';
import { theme } from '../styles/theme';

interface UserProfile {
  name: string;
  email: string;
  totalExpenses: number;
  totalOwed: number;
  totalOwing: number;
  groupsCount: number;
}

const mockProfile: UserProfile = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  totalExpenses: 1247.50,
  totalOwed: 89.25,
  totalOwing: 45.75,
  groupsCount: 5,
};

export default function ProfileScreen() {
  const [profile] = useState<UserProfile>(mockProfile);
  const [notifications, setNotifications] = useState(true);
  const [autoSettle, setAutoSettle] = useState(false);
  const [biometric, setBiometric] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your expense data as CSV or PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => {} },
        { text: 'PDF', onPress: () => {} },
      ]
    );
  };

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
  }> = ({ icon, title, subtitle, onPress, showArrow = true, rightElement }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightElement}
        {showArrow && <ChevronRight size={18} color="#9CA3AF" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#10B981" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{profile.totalExpenses.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.positiveValue]}>
                ₹{profile.totalOwed.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>You're Owed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.negativeValue]}>
                ₹{profile.totalOwing.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>You Owe</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.groupsCount}</Text>
              <Text style={styles.statLabel}>Active Groups</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={<Bell size={20} color="#6B7280" />}
              title="Notifications"
              subtitle="Push notifications and reminders"
              onPress={() => {}}
              showArrow={false}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <MenuItem
              icon={<CreditCard size={20} color="#6B7280" />}
              title="Auto-Settle"
              subtitle="Automatically settle small amounts"
              onPress={() => {}}
              showArrow={false}
              rightElement={
                <Switch
                  value={autoSettle}
                  onValueChange={setAutoSettle}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <MenuItem
              icon={<Shield size={20} color="#6B7280" />}
              title="Biometric Lock"
              subtitle="Use fingerprint or face unlock"
              onPress={() => {}}
              showArrow={false}
              rightElement={
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Data & Export</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={<Download size={20} color="#6B7280" />}
              title="Export Data"
              subtitle="Download your expense history"
              onPress={handleExportData}
            />
            <MenuItem
              icon={<Share size={20} color="#6B7280" />}
              title="Share App"
              subtitle="Invite friends to Splitwise"
              onPress={() => {}}
            />
            <MenuItem
              icon={<FileText size={20} color="#6B7280" />}
              title="Monthly Reports"
              subtitle="View detailed expense reports"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={<HelpCircle size={20} color="#6B7280" />}
              title="Help & FAQ"
              subtitle="Get help with Splitwise"
              onPress={() => {}}
            />
            <MenuItem
              icon={<Smartphone size={20} color="#6B7280" />}
              title="Contact Support"
              subtitle="Get in touch with our team"
              onPress={() => {}}
            />
            <MenuItem
              icon={<Settings size={20} color="#6B7280" />}
              title="App Settings"
              subtitle="Manage app preferences"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={<LogOut size={20} color="#EF4444" />}
              title="Log Out"
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Splitwise v1.0.0</Text>
          <Text style={styles.appDescription}>
            Smart expense splitting with OCR technology
          </Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  profileSection: {
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.lightBg,
  },
  editButtonText: {
    fontSize: 14,
    color: theme.colors.primaryBg,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  positiveValue: {
    color: theme.colors.accent,
  },
  negativeValue: {
    color: theme.colors.secondary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onPrimary,
    fontFamily: theme.fontFamily,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuContainer: {
    backgroundColor: theme.colors.lightBg,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.onLight,
    fontFamily: theme.fontFamily,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  appVersion: {
    fontSize: 14,
    color: theme.text.muted,
    fontWeight: '700',
    fontFamily: theme.fontFamily,
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: theme.text.muted,
    fontFamily: theme.fontFamily,
    textAlign: 'center',
  },
});
