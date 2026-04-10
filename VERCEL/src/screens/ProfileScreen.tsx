import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Shield,
  UserX,
  Palette,
  LogOut,
  ChevronRight,
  Camera,
  Edit3,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { FriendsPanel } from '../components/FriendsPanel';
import { SecurityPanel } from '../components/SecurityPanel';
import { BlockedUsersPanel } from '../components/BlockedUsersPanel';
import { ThemePanel } from '../components/ThemePanel';

export function ProfileScreen() {
  const { currentUser, logout, friends, blockedUsers } = useAppContext();

  // Panel visibility states
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showBlockedUsersPanel, setShowBlockedUsersPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    console.log('Edit profile');
  };

  const handleChangePhoto = () => {
    // TODO: Implement photo picker
    console.log('Change photo');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Mock current user for development
  const user = currentUser || {
    id: 'mock',
    displayName: 'Demo User',
    email: 'demo@example.com',
    photoURL: null,
    about: 'Hey there! I am using this chat app.',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={user.photoURL}
              name={user.displayName}
              size="xlarge"
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto}>
              <Camera size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <Edit3 size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.about && <Text style={styles.userAbout}>{user.about}</Text>}
          </View>
        </View>

        {/* Settings Sections */}
        <SettingsSection title="Social">
          <SettingsRow
            icon={<Users size={18} color={colors.primary} />}
            title="Friends"
            value={friends.length > 0 ? `${friends.length}` : undefined}
            onPress={() => setShowFriendsPanel(true)}
            isFirst
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Settings">
          <SettingsRow
            icon={<Shield size={18} color={colors.online} />}
            title="Security"
            subtitle="Password, sessions, login activity"
            onPress={() => setShowSecurityPanel(true)}
            isFirst
          />
          <SettingsRow
            icon={<UserX size={18} color={colors.warning} />}
            title="Blocked Users"
            value={blockedUsers.length > 0 ? `${blockedUsers.length}` : undefined}
            onPress={() => setShowBlockedUsersPanel(true)}
          />
          <SettingsRow
            icon={<Palette size={18} color={colors.primaryLight} />}
            title="Theme & Appearance"
            subtitle="Colors, chat bubbles, wallpapers"
            onPress={() => setShowThemePanel(true)}
            isLast
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection>
          <SettingsRow
            icon={<LogOut size={18} color={colors.danger} />}
            title="Log Out"
            isDestructive
            showChevron={false}
            onPress={handleLogout}
            isFirst
            isLast
          />
        </SettingsSection>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Settings Panels */}
      <FriendsPanel
        visible={showFriendsPanel}
        onClose={() => setShowFriendsPanel(false)}
      />

      <SecurityPanel
        visible={showSecurityPanel}
        onClose={() => setShowSecurityPanel(false)}
      />

      <BlockedUsersPanel
        visible={showBlockedUsersPanel}
        onClose={() => setShowBlockedUsersPanel(false)}
      />

      <ThemePanel
        visible={showThemePanel}
        onClose={() => setShowThemePanel(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editButton: {
    padding: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userAbout: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});

export default ProfileScreen;
