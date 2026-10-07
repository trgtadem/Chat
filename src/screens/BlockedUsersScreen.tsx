import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, ShieldBan } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type BlockedUsersScreenProps = NativeStackScreenProps<RootStackParamList, 'BlockedUsers'>;

export function BlockedUsersScreen({ navigation }: BlockedUsersScreenProps) {
  const { blockedUsers, unblockUser } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Engellenen Kullanıcılar</Text>
        <View style={{ width: 40 }} />
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ShieldBan size={42} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Engellenen kullanıcı yok</Text>
          <Text style={styles.emptySubtitle}>Engellediğin kişiler burada listelenir.</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.user?.avatar ?? 'https://via.placeholder.com/48' }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.user?.name ?? 'Unknown'} {item.user?.surname ?? ''}</Text>
                <Text style={styles.email}>{item.user?.email ?? 'No email'}</Text>
              </View>
              <TouchableOpacity style={styles.unblockButton} onPress={() => unblockUser(item.blockedUserId)}>
                <Text style={styles.unblockText}>Kaldır</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
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
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyTitle: {
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      marginTop: 14,
    },
    emptySubtitle: {
      color: t.colors.textSecondary,
      marginTop: 6,
      textAlign: 'center',
      fontSize: 14 * t.fontScale,
    },
    card: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: t.radius.pill,
    },
    name: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
      fontWeight: '700',
    },
    email: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginTop: 2,
    },
    unblockButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    unblockText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 13 * t.fontScale,
    },
  });
