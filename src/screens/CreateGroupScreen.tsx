import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Check } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { useFeedback } from '../feedback/FeedbackContext';
import { createGroup } from '../services/groups';
import { Friend, User } from '../types';

type CreateGroupScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

function friendToUser(f: Friend): User {
  return {
    id: f.id,
    email: '',
    name: f.name ?? 'Unknown',
    surname: f.surname ?? '',
    avatar: f.avatar ?? 'https://via.placeholder.com/50',
    online: false,
    lastSeen: null,
  };
}

export function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const { currentUser, friends } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (!currentUser) return null;

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0) {
      toast.warning('En az bir arkadaş seçmelisin.', 'Üye gerekli');
      return;
    }
    const name = groupName.trim() || 'Grup';
    const members = friends
      .filter((f) => selectedIds.has(f.id))
      .map(friendToUser);

    setCreating(true);
    try {
      const groupId = await createGroup(currentUser, name, members);
      navigation.replace('GroupChat', { groupId, groupName: name });
    } catch (e) {
      console.error('createGroup', e);
      toast.error('Grup oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grup Oluştur</Text>
        <TouchableOpacity
          onPress={handleCreate}
          style={styles.createButton}
          disabled={creating || selectedIds.size === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text
              style={[
                styles.createText,
                selectedIds.size === 0 && styles.createTextDisabled,
              ]}
            >
              Oluştur
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.label}>Grup adı</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Grup adı girin"
          placeholderTextColor={theme.colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
      </View>

      <Text style={styles.sectionTitle}>Arkadaşlar</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>Henüz arkadaşın yok.</Text>
        ) : (
          friends.map((f) => {
            const selected = selectedIds.has(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                style={styles.friendRow}
                onPress={() => toggleFriend(f.id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: f.avatar ?? 'https://via.placeholder.com/48' }}
                  style={styles.avatar}
                />
                <Text style={styles.friendName}>
                  {f.name} {f.surname}
                </Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Check size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
    },
    createButton: {
      minWidth: 64,
      alignItems: 'flex-end',
    },
    createText: {
      color: t.colors.primary,
      fontSize: 16 * t.fontScale,
      fontWeight: '700',
    },
    createTextDisabled: {
      opacity: 0.4,
    },
    nameSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    label: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      marginBottom: 8,
    },
    nameInput: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
    },
    sectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: t.radius.pill,
      marginRight: 12,
    },
    friendName: {
      flex: 1,
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      fontWeight: '500',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: t.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    emptyText: {
      color: t.colors.textSecondary,
      textAlign: 'center',
      marginTop: 24,
      fontSize: 14 * t.fontScale,
    },
  });
