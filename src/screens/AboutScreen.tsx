import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, MessageCircleMore } from 'lucide-react-native';
import Constants from 'expo-constants';

import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: AboutScreenProps) {
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
        <Text style={styles.headerTitle}>Hakkında</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MessageCircleMore size={42} color={theme.colors.primary} />
        </View>

        <Text style={styles.appName}>Chat</Text>
        <Text style={styles.appSub}>Hızlı, sade ve modern mesajlaşma deneyimi.</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Sürüm</Text>
          <Text style={styles.infoValue}>{Constants.expoConfig?.version ?? 'Unknown'}</Text>
        </View>

        <Text style={styles.footerText}>
          Bu uygulama Firebase altyapısı üzerinde gerçek zamanlı mesajlaşma için geliştirilmiştir.
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
      flex: 1,
      alignItems: 'center',
      padding: 20,
    },
    iconWrap: {
      width: 86,
      height: 86,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    appName: {
      marginTop: 16,
      color: t.colors.textPrimary,
      fontSize: 24 * t.fontScale,
      fontWeight: '700',
    },
    appSub: {
      marginTop: 8,
      color: t.colors.textSecondary,
      textAlign: 'center',
      fontSize: 14 * t.fontScale,
    },
    infoCard: {
      marginTop: 20,
      width: '100%',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
    },
    infoTitle: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    infoValue: {
      marginTop: 6,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    footerText: {
      marginTop: 18,
      color: t.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontSize: 14 * t.fontScale,
    },
  });
