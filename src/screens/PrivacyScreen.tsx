import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { DEFAULT_PRIVACY } from '../hooks/useUserPresence';
import { getPrivacySettings, updatePrivacySettings } from '../services/privacy';

type PrivacyScreenProps = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const { currentUser } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [showOnlineStatus, setShowOnlineStatus] = useState(DEFAULT_PRIVACY.showOnline);
  const [allowReadReceipts, setAllowReadReceipts] = useState(DEFAULT_PRIVACY.showReadReceipts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await getPrivacySettings(currentUser.id);
        if (!cancelled) {
          setShowOnlineStatus(p.showOnline);
          setAllowReadReceipts(p.showReadReceipts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const persist = async (next: { showOnline?: boolean; showReadReceipts?: boolean }) => {
    if (!currentUser?.id || saving) return;
    setSaving(true);
    try {
      await updatePrivacySettings(currentUser.id, next);
    } catch (e) {
      console.error('privacy update error:', e);
    } finally {
      setSaving(false);
    }
  };

  const onToggleOnline = (value: boolean) => {
    setShowOnlineStatus(value);
    void persist({ showOnline: value });
  };

  const onToggleRead = (value: boolean) => {
    setAllowReadReceipts(value);
    void persist({ showReadReceipts: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Çevrimiçi / Son görülme</Text>
              <Text style={styles.rowSubtitle}>
                Kapalıysa diğerleri seni çevrimdışı görür; son görülme kimseye gösterilmez.
              </Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={onToggleOnline}
              disabled={saving}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Okundu Bilgisi</Text>
              <Text style={styles.rowSubtitle}>
                Kapalıysa mesajlar yalnızca iletildi olarak işaretlenir; mavi tik gönderilmez.
              </Text>
            </View>
            <Switch
              value={allowReadReceipts}
              onValueChange={onToggleRead}
              disabled={saving}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <Text style={styles.infoText}>
            Bu ayarlar hesabına kaydedilir ve tüm cihazlarda geçerlidir.
          </Text>
        </View>
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
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
      padding: 16,
      gap: 12,
    },
    row: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    rowTextWrap: {
      flex: 1,
    },
    rowTitle: {
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      fontWeight: '600',
    },
    rowSubtitle: {
      color: t.colors.textSecondary,
      marginTop: 4,
      fontSize: 13 * t.fontScale,
    },
    infoText: {
      color: t.colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
      fontSize: 13 * t.fontScale,
    },
  });
