import React, { useLayoutEffect } from 'react';
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
import { ChevronLeft, PencilLine, Circle } from 'lucide-react-native';

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';
import { useAppContext } from '../context/AppContext';
import { formatLastSeen } from '../utils';

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ route, navigation }: ProfileScreenProps) {
  const { currentUser } = useAppContext();
  const { user } = route.params;
  const isOwnProfile = currentUser?.id === user.id;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
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
              fill={user.online ? COLORS.success : COLORS.textSecondary}
              color={user.online ? COLORS.success : COLORS.textSecondary}
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
            <PencilLine size={18} color="#000" />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 18,
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: COLORS.surface,
  },
  onlineRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    marginTop: 18,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  email: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  card: {
    marginTop: 24,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
  },
  cardValue: {
    color: COLORS.textPrimary,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  editButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
