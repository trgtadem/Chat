import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  ChevronRight,
  UserRound,
  Palette,
  Shield,
  Lock,
  Ban,
  Info,
  AppWindow,
} from 'lucide-react-native';
import Constants from 'expo-constants';

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type SettingItemProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  value?: string;
};

function SettingItem({ title, subtitle, icon, onPress, value }: SettingItemProps) {
  const content = (
    <>
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {value ? <Text style={styles.itemValue}>{value}</Text> : <ChevronRight size={18} color={COLORS.textSecondary} />}
    </>
  );

  if (!onPress) {
    return <View style={styles.item}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.85}>
      {content}
    </TouchableOpacity>
  );
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <SettingItem
            title="Profili Düzenle"
            subtitle="Ad, soyad, fotoğraf ve hakkımda"
            icon={<UserRound size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tercihler</Text>
          <SettingItem
            title="Temalar"
            subtitle="Görünüm ve sohbet tasarımı"
            icon={<Palette size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('Themes')}
          />
          <SettingItem
            title="Güvenlik"
            subtitle="Hesap ve oturum yönetimi"
            icon={<Shield size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('Security')}
          />
          <SettingItem
            title="Gizlilik"
            subtitle="Profil ve mesajlaşma gizliliği"
            icon={<Lock size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('Privacy')}
          />
          <SettingItem
            title="Engellenen Kullanıcılar"
            subtitle="Engellediğin kişileri yönet"
            icon={<Ban size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <SettingItem
            title="Hakkında"
            subtitle="Uygulama ve geliştirici bilgileri"
            icon={<Info size={18} color={COLORS.primary} />}
            onPress={() => navigation.navigate('About')}
          />
          <SettingItem
            title="Versiyon"
            subtitle="Yüklü sürüm"
            icon={<AppWindow size={18} color={COLORS.primary} />}
            value={appVersion}
          />
        </View>
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.14)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  itemValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
