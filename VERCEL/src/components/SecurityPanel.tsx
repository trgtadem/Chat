import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { Session } from '../types';
import { PanelHeader } from './PanelHeader';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';

interface SecurityPanelProps {
  visible: boolean;
  onClose: () => void;
}

// Mock sessions data - TODO: Replace with real session data from backend
const mockSessions: Session[] = [
  {
    id: '1',
    deviceName: 'iPhone 15 Pro',
    deviceType: 'mobile',
    os: 'iOS 17.4',
    location: 'Istanbul, Turkey',
    lastActive: new Date(),
    isCurrent: true,
  },
  {
    id: '2',
    deviceName: 'MacBook Pro',
    deviceType: 'desktop',
    browser: 'Safari',
    os: 'macOS Sonoma',
    location: 'Istanbul, Turkey',
    lastActive: new Date(Date.now() - 3600000),
    isCurrent: false,
  },
  {
    id: '3',
    deviceName: 'iPad Air',
    deviceType: 'tablet',
    os: 'iPadOS 17.4',
    location: 'Ankara, Turkey',
    lastActive: new Date(Date.now() - 86400000),
    isCurrent: false,
  },
];

function getDeviceIcon(type: Session['deviceType']) {
  const iconProps = { size: 20, color: colors.textSecondary };
  switch (type) {
    case 'mobile':
      return <Smartphone {...iconProps} />;
    case 'tablet':
      return <Tablet {...iconProps} />;
    default:
      return <Monitor {...iconProps} />;
  }
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Active now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

function SessionCard({ session, onSignOut }: { session: Session; onSignOut?: () => void }) {
  return (
    <View style={[styles.sessionCard, session.isCurrent && styles.currentSession]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIconContainer}>{getDeviceIcon(session.deviceType)}</View>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionName}>{session.deviceName}</Text>
            {session.isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>This device</Text>
              </View>
            )}
          </View>
          <Text style={styles.sessionDetails}>
            {session.os}
            {session.browser ? ` / ${session.browser}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.sessionMeta}>
        <View style={styles.sessionMetaRow}>
          <MapPin size={14} color={colors.textTertiary} />
          <Text style={styles.sessionMetaText}>{session.location || 'Unknown location'}</Text>
        </View>
        <Text style={styles.sessionTime}>{formatLastActive(session.lastActive)}</Text>
      </View>

      {!session.isCurrent && onSignOut && (
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SecurityPanel({ visible, onClose }: SecurityPanelProps) {
  const { currentUser } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // TODO: Replace with real sessions from backend
  const [sessions] = useState<Session[]>(mockSessions);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement password change with Firebase
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOutSession = (sessionId: string) => {
    Alert.alert(
      'Sign Out Device',
      'Are you sure you want to sign out this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement session sign out
            console.log('Sign out session:', sessionId);
          },
        },
      ]
    );
  };

  const handleSignOutAllSessions = () => {
    Alert.alert(
      'Sign Out All Devices',
      'This will sign you out from all other devices. You will stay signed in on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement sign out all sessions
            console.log('Sign out all sessions');
          },
        },
      ]
    );
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <PanelHeader title="Security" onBack={onClose} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Change Password Section */}
          <SettingsSection title="Change Password">
            <View style={styles.passwordSection}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.changePasswordButton, isChangingPassword && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.changePasswordText}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </SettingsSection>

          {/* Current Session */}
          {currentSession && (
            <SettingsSection title="Current Session">
              <View style={styles.sessionsContainer}>
                <SessionCard session={currentSession} />
              </View>
            </SettingsSection>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <SettingsSection
              title={`Other Sessions (${otherSessions.length})`}
              footer="These are devices that are currently signed in to your account."
            >
              <View style={styles.sessionsContainer}>
                {otherSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onSignOut={() => handleSignOutSession(session.id)}
                  />
                ))}
              </View>
            </SettingsSection>
          )}

          {/* Sign Out All Sessions */}
          {otherSessions.length > 0 && (
            <SettingsSection>
              <SettingsRow
                icon={<LogOut size={18} color={colors.danger} />}
                title="Sign out all other sessions"
                isDestructive
                showChevron={false}
                onPress={handleSignOutAllSessions}
                isFirst
                isLast
              />
            </SettingsSection>
          )}
        </ScrollView>
      </View>
    </Modal>
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
  passwordSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.md,
  },
  changePasswordButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  changePasswordText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sessionsContainer: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  currentSession: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sessionName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sessionDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionMetaText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  sessionTime: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.danger,
  },
});

export default SecurityPanel;
