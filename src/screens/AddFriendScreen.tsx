import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Share2, UserPlus, Check, X, ScanLine, Inbox, Send } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { normalizeFriendCode } from '../utils/friendCode';
import { useFeedback } from '../feedback/FeedbackContext';
import { EmptyState } from '../components/EmptyState';
import { cancelRequest, subscribeSentRequests } from '../services/friends';

type AddFriendScreenProps = NativeStackScreenProps<RootStackParamList, 'AddFriend'>;

const REASON_MESSAGES: Record<string, string> = {
  not_found: 'Bu koda sahip bir kullanıcı bulunamadı.',
  self: 'Kendi kodunu ekleyemezsin.',
  already_friend: 'Bu kullanıcı zaten arkadaşın.',
  already_sent: 'Bu kullanıcıya zaten istek gönderdin.',
  incoming_pending: 'Bu kullanıcı sana zaten istek göndermiş. Gelen isteklerden kabul edebilirsin.',
  error: 'İstek gönderilirken bir hata oluştu.',
};

export function AddFriendScreen({ navigation }: AddFriendScreenProps) {
  const { currentUser, incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } =
    useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<
    { toUid: string; toUser?: { name?: string; surname?: string; avatar?: string } }[]
  >([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser?.id) return;
    return subscribeSentRequests(currentUser.id, (reqs) => {
      setSentRequests(
        reqs.map((r) => ({
          toUid: r.toUid,
          toUser: (r as any).toUser,
        }))
      );
    });
  }, [currentUser?.id]);

  const myCode = currentUser?.friendCode ?? '...';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Arkadaş kodum: ${myCode}`,
      });
    } catch {
      // yok say
    }
  };

  const handleSend = async () => {
    const trimmed = normalizeFriendCode(code);
    if (!trimmed) return;
    setSending(true);
    try {
      const result = await sendFriendRequest(trimmed);
      if (result.ok) {
        setCode('');
        toast.success('Arkadaşlık isteğin karşı tarafa iletildi.', 'İstek Gönderildi');
      } else {
        toast.warning(REASON_MESSAGES[result.reason] ?? 'Bilinmeyen hata.', 'Gönderilemedi');
      }
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (req: (typeof incomingRequests)[number]) => {
    setBusyId(req.fromUid);
    try {
      await acceptFriendRequest(req);
    } catch (e) {
      toast.error('İstek kabul edilemedi.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (fromUid: string) => {
    setBusyId(fromUid);
    try {
      await declineFriendRequest(fromUid);
    } catch (e) {
      toast.error('İstek reddedilemedi.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelSent = async (toUid: string) => {
    if (!currentUser?.id) return;
    setBusyId(toUid);
    try {
      await cancelRequest(currentUser.id, toUid);
      toast.success('İstek iptal edildi.');
    } catch {
      toast.error('İstek iptal edilemedi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Arkadaş Ekle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Senin kodun */}
        <View style={styles.codeCard}>
          <Text style={styles.cardLabel}>Senin Arkadaş Kodun</Text>
          <Text style={styles.codeText}>{myCode}</Text>
          {myCode.length === 8 && (
            <View style={styles.qrWrap}>
              <QRCode
                value={myCode}
                size={160}
                backgroundColor={theme.colors.surface}
                color={theme.colors.textPrimary}
              />
            </View>
          )}
          <Text style={styles.qrHint}>Bu QR’ı taratarak beni ekleyebilirler</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
              <Share2 size={18} color={theme.colors.onAccent} />
              <Text style={styles.shareText}>Kodu Paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('ScanFriendQR')}
              activeOpacity={0.85}
            >
              <ScanLine size={18} color={theme.colors.primary} />
              <Text style={styles.scanText}>QR Tara</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Bu kodu paylaştığın kişiler sana arkadaşlık isteği gönderebilir.</Text>
        </View>

        {/* Kod ile ekle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kod ile Ekle</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Arkadaş kodu gir"
              placeholderTextColor={theme.colors.textMuted}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!code.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!code.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.onAccent} />
              ) : (
                <UserPlus size={20} color={theme.colors.onAccent} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Gelen istekler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Gelen İstekler{incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}
          </Text>
          {incomingRequests.length === 0 ? (
            <EmptyState icon={Inbox} title="Bekleyen istek yok" subtitle="Gelen arkadaşlık istekleri burada görünür." />
          ) : (
            incomingRequests.map((req) => (
              <View key={req.fromUid} style={styles.requestRow}>
                <Image
                  source={{ uri: req.fromUser?.avatar || 'https://via.placeholder.com/48' }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName}>
                    {req.fromUser?.name ?? 'Kullanıcı'} {req.fromUser?.surname ?? ''}
                  </Text>
                  <Text style={styles.requestSub}>Arkadaşlık isteği</Text>
                </View>
                {busyId === req.fromUid ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAccept(req)}
                    >
                      <Check size={18} color={theme.colors.onAccent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => handleDecline(req.fromUid)}
                    >
                      <X size={18} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Giden İstekler{sentRequests.length > 0 ? ` (${sentRequests.length})` : ''}
          </Text>
          {sentRequests.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Giden istek yok"
              subtitle="Gönderdiğin istekleri buradan iptal edebilirsin."
            />
          ) : (
            sentRequests.map((req) => (
              <View key={req.toUid} style={styles.requestRow}>
                <Image
                  source={{ uri: req.toUser?.avatar || 'https://via.placeholder.com/48' }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName}>
                    {req.toUser?.name || 'Kullanıcı'} {req.toUser?.surname || ''}
                  </Text>
                  <Text style={styles.requestSub}>Bekliyor</Text>
                </View>
                {busyId === req.toUid ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() => handleCancelSent(req.toUid)}
                  >
                    <X size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
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
    content: {
      padding: 16,
      gap: 16,
    },
    codeCard: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 20,
      alignItems: 'center',
    },
    cardLabel: {
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
    },
    codeText: {
      color: t.colors.textPrimary,
      fontSize: 34 * t.fontScale,
      fontWeight: '800',
      letterSpacing: 4,
      marginTop: 10,
      marginBottom: 12,
    },
    qrWrap: {
      padding: 12,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      marginBottom: 8,
    },
    qrHint: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginBottom: 14,
      textAlign: 'center',
    },
    codeActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.pill,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    shareText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    scanText: {
      color: t.colors.primary,
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
    hint: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      textAlign: 'center',
      marginTop: 14,
      lineHeight: 18,
    },
    section: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
    },
    sectionTitle: {
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
      marginBottom: 12,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      letterSpacing: 2,
    },
    sendButton: {
      width: 52,
      height: 52,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
    },
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: t.radius.pill,
    },
    requestName: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
      fontWeight: '700',
    },
    requestSub: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginTop: 2,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    acceptBtn: {
      backgroundColor: t.colors.primary,
    },
    declineBtn: {
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
  });
