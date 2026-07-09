import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type PrivacyScreenProps = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowReadReceipts, setAllowReadReceipts] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Çevrimiçi Durum</Text>
            <Text style={styles.rowSubtitle}>Diğer kullanıcılar çevrimiçi durumunu görebilir.</Text>
          </View>
          <Switch
            value={showOnlineStatus}
            onValueChange={setShowOnlineStatus}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Okundu Bilgisi</Text>
            <Text style={styles.rowSubtitle}>Mesajları okuduğunda mavi tik gönder.</Text>
          </View>
          <Switch
            value={allowReadReceipts}
            onValueChange={setAllowReadReceipts}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>

        <Text style={styles.infoText}>
          Not: Bu ayarlar şu an cihaz içi önizleme olarak çalışır; kalıcı gizlilik senkronu bir sonraki adımda Firestore ile bağlanacaktır.
        </Text>
      </View>
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
