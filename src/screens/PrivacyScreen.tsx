import React, { useLayoutEffect, useState } from 'react';
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

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';

type PrivacyScreenProps = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowReadReceipts, setAllowReadReceipts] = useState(true);

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
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
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
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
          />
        </View>

        <Text style={styles.infoText}>
          Not: Bu ayarlar şu an cihaz içi önizleme olarak çalışır; kalıcı gizlilik senkronu bir sonraki adımda Firestore ile bağlanacaktır.
        </Text>
      </View>
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
    padding: 16,
    gap: 12,
  },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  infoText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});
