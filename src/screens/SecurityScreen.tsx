import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, LogOut, ShieldCheck } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type SecurityScreenProps = NativeStackScreenProps<RootStackParamList, 'Security'>;

export function SecurityScreen({ navigation }: SecurityScreenProps) {
  const { handleLogout } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const confirmLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => handleLogout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Güvenlik</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <ShieldCheck size={22} color={theme.colors.success} />
          <Text style={styles.cardTitle}>Hesap Güvenliği</Text>
          <Text style={styles.cardText}>
            E-posta doğrulama ve oturum doğrulaması aktif. Güvenliği artırmak için güçlü parola kullan.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#fff" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
      flex: 1,
      padding: 16,
      justifyContent: 'space-between',
    },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
    },
    cardTitle: {
      marginTop: 10,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    cardText: {
      marginTop: 8,
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      lineHeight: 20,
    },
    logoutButton: {
      backgroundColor: t.colors.error,
      borderRadius: t.radius.lg,
      paddingVertical: 16,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutText: {
      color: '#fff',
      fontSize: 15 * t.fontScale,
      fontWeight: '700',
    },
  });
