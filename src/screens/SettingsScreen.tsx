import React, { useLayoutEffect, useMemo } from 'react';
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

import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type SettingItemProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  value?: string;
  styles: ReturnType<typeof makeStyles>;
  chevronColor: string;
};

function SettingItem({ title, subtitle, icon, onPress, value, styles, chevronColor }: SettingItemProps) {
  const content = (
    <>
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {value ? <Text style={styles.itemValue}>{value}</Text> : <ChevronRight size={18} color={chevronColor} />}
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
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
            icon={<UserRound size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('EditProfile')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tercihler</Text>
          <SettingItem
            title="Temalar"
            subtitle="Görünüm, renk ve sohbet tasarımı"
            icon={<Palette size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('Themes')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
          <SettingItem
            title="Güvenlik"
            subtitle="Hesap ve oturum yönetimi"
            icon={<Shield size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('Security')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
          <SettingItem
            title="Gizlilik"
            subtitle="Profil ve mesajlaşma gizliliği"
            icon={<Lock size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('Privacy')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
          <SettingItem
            title="Engellenen Kullanıcılar"
            subtitle="Engellediğin kişileri yönet"
            icon={<Ban size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('BlockedUsers')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <SettingItem
            title="Hakkında"
            subtitle="Uygulama ve geliştirici bilgileri"
            icon={<Info size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('About')}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
          <SettingItem
            title="Versiyon"
            subtitle="Yüklü sürüm"
            icon={<AppWindow size={18} color={theme.colors.primary} />}
            value={appVersion}
            styles={styles}
            chevronColor={theme.colors.textSecondary}
          />
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
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    sectionCard: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      padding: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    sectionTitle: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: t.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    itemTitle: {
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      fontWeight: '600',
    },
    itemSubtitle: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginTop: 2,
    },
    itemValue: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
  });
