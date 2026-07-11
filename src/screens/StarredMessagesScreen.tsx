import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Star, Image as ImageIcon, Mic, FileText, StarOff } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { StarredMessage, subscribeStarredForFriend, unstarMessage } from '../services/starred';
import { formatTime } from '../utils';
import { useFeedback } from '../feedback/FeedbackContext';
import { EmptyState } from '../components/EmptyState';

type StarredMessagesScreenProps = NativeStackScreenProps<RootStackParamList, 'StarredMessages'>;

export function StarredMessagesScreen({ navigation, route }: StarredMessagesScreenProps) {
  const { friend } = route.params;
  const { currentUser } = useAppContext();
  const { toast, confirm } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [items, setItems] = useState<StarredMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    const unsub = subscribeStarredForFriend(currentUser.id, friend.id, (list) => {
      setItems(list);
      setLoading(false);
    });
    return unsub;
  }, [currentUser?.id, friend.id]);

  const openChatAtMessage = (messageId: string) => {
    if (!currentUser) return;
    navigation.navigate('Chat', {
      user: currentUser,
      friend,
      focusMessageId: messageId,
    });
  };

  const handleUnstar = async (messageId: string) => {
    if (!currentUser?.id) return;
    const ok = await confirm({
      title: 'Yıldızı kaldır',
      message: 'Bu mesajın yıldızını kaldırmak istiyor musun?',
      confirmLabel: 'Kaldır',
      destructive: true,
    });
    if (!ok) return;
    try {
      await unstarMessage(currentUser.id, messageId);
    } catch (e) {
      console.error(e);
      toast.error('Yıldız kaldırılamadı.');
    }
  };

  const preview = (item: StarredMessage) => {
    if (item.type === 'text') return item.text || '';
    if (item.type === 'image') return 'Fotoğraf';
    if (item.type === 'audio') return 'Sesli mesaj';
    return item.fileName || 'Dosya';
  };

  const TypeIcon = ({ type }: { type: StarredMessage['type'] }) => {
    if (type === 'image') return <ImageIcon size={18} color={theme.colors.primary} />;
    if (type === 'audio') return <Mic size={18} color={theme.colors.primary} />;
    if (type === 'file') return <FileText size={18} color={theme.colors.primary} />;
    return <Star size={18} color={theme.colors.primary} fill={theme.colors.primary} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yıldızlı Mesajlar</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Star}
          title={`${friend.name} ile yıldızlı mesaj yok`}
          subtitle="Bir mesaja basılı tutup yıldız ikonuna dokunarak kaydedebilirsin."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.messageId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => openChatAtMessage(item.messageId)}
                activeOpacity={0.8}
              >
                <TypeIcon type={item.type} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText} numberOfLines={2}>
                    {preview(item)}
                  </Text>
                  <Text style={styles.rowMeta}>{formatTime(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUnstar(item.messageId)}
                style={styles.unstarBtn}
                hitSlop={8}
              >
                <StarOff size={18} color={theme.colors.error} />
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
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14 * t.fontScale,
      color: t.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: 10,
      overflow: 'hidden',
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    unstarBtn: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: t.colors.border,
    },
    rowText: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
    },
    rowMeta: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginTop: 4,
    },
  });
