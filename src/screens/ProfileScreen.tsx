import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, PencilLine, Circle, UserMinus } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { formatLastSeen } from '../utils';
import { removeFriend } from '../services/account';
import { useFeedback } from '../feedback/FeedbackContext';

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ route, navigation }: ProfileScreenProps) {
  const { currentUser, isFriend } = useAppContext();
  const { toast, confirm } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = route.params;
  const isOwnProfile = currentUser?.id === user.id;
  const canUnfriend = !isOwnProfile && !!currentUser?.id && isFriend(user.id);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleUnfriend = async () => {
    if (!currentUser?.id) return;
    const ok = await confirm({
      title: 'Arkadaşlıktan çıkar',
      message: `${user.name} ile arkadaşlığın kaldırılacak.`,
      confirmLabel: 'Çıkar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeFriend(currentUser.id, user.id);
      toast.success('Arkadaşlıktan çıkarıldı.');
      navigation.navigate('Home');
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.onlineRow}>
            <Circle
              size={10}
              fill={user.online ? theme.colors.success : theme.colors.textSecondary}
              color={user.online ? theme.colors.success : theme.colors.textSecondary}
            />
            <Text style={styles.onlineText}>
              {user.online ? 'Çevrimiçi' : user.lastSeen ? formatLastSeen(user.lastSeen) : 'Çevrimdışı'}
            </Text>
          </View>
        </View>

        <Text style={styles.name}>
          {user.name} {user.surname}
        </Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hakkında</Text>
          <Text style={styles.cardValue}>
            {user.about?.trim() ? user.about : 'Bu kullanıcı henüz bir açıklama eklemedi.'}
          </Text>
        </View>

        {isOwnProfile ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.86}
          >
            <PencilLine size={18} color={theme.colors.onAccent} />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        ) : null}

        {canUnfriend ? (
          <TouchableOpacity
            style={styles.unfriendButton}
            onPress={handleUnfriend}
            activeOpacity={0.86}
          >
            <UserMinus size={18} color="#fff" />
            <Text style={styles.unfriendText}>Arkadaşlıktan Çıkar</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    headerTitle: {
      color: t.colors.textPrimary,
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
    },
    content: { padding: 18, alignItems: 'center' },
    avatarWrap: { alignItems: 'center', marginTop: 8 },
    avatar: {
      width: 118,
      height: 118,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
    },
    onlineRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    onlineText: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
    },
    name: {
      marginTop: 18,
      color: t.colors.textPrimary,
      fontSize: 24 * t.fontScale,
      fontWeight: '700',
    },
    email: {
      marginTop: 6,
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
    },
    card: {
      marginTop: 24,
      width: '100%',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
    },
    cardTitle: {
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
    },
    cardValue: {
      color: t.colors.textPrimary,
      marginTop: 8,
      fontSize: 15 * t.fontScale,
      lineHeight: 22,
    },
    editButton: {
      marginTop: 20,
      width: '100%',
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      paddingVertical: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    editButtonText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
    unfriendButton: {
      marginTop: 12,
      width: '100%',
      backgroundColor: t.colors.error,
      borderRadius: t.radius.lg,
      paddingVertical: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    unfriendText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
  });
