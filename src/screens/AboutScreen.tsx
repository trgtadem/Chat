import React, { useLayoutEffect } from 'react';
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

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';

type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: AboutScreenProps) {
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
        <Text style={styles.headerTitle}>Hakkında</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MessageCircleMore size={42} color={COLORS.primary} />
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
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(59,130,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  appName: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  appSub: {
    marginTop: 8,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  infoTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
