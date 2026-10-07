import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, LogOut, KeyRound, ShieldCheck, Trash2 } from 'lucide-react-native';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

import { auth } from '../../firebaseConfig';
import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { useFeedback } from '../feedback/FeedbackContext';
import { deleteAccount } from '../services/account';

type SecurityScreenProps = NativeStackScreenProps<RootStackParamList, 'Security'>;

export function SecurityScreen({ navigation }: SecurityScreenProps) {
  const { handleLogout, currentUser } = useAppContext();
  const { toast, confirm } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const confirmLogout = async () => {
    const ok = await confirm({
      title: 'Çıkış Yap',
      message: 'Hesabından çıkış yapmak istiyor musun?',
      confirmLabel: 'Çıkış Yap',
      destructive: true,
    });
    if (ok) handleLogout();
  };

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      toast.error('Oturum bulunamadı.');
      return;
    }
    if (!currentPassword || !newPassword) {
      toast.warning('Mevcut ve yeni şifreyi gir.', 'Eksik bilgi');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('Yeni şifre en az 6 karakter olmalı.', 'Zayıf şifre');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Yeni şifreler eşleşmiyor.', 'Uyuşmazlık');
      return;
    }

    setChanging(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Şifren güncellendi.');
    } catch (error: any) {
      const code = error?.code as string | undefined;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Mevcut şifre yanlış.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Çok fazla deneme. Bir süre sonra tekrar dene.');
      } else {
        toast.error(error?.message || 'Şifre değiştirilemedi.');
      }
    } finally {
      setChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.warning('Hesabı silmek için şifreni gir.');
      return;
    }
    const ok = await confirm({
      title: 'Hesabı Sil',
      message:
        'Hesabın kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musun?',
      confirmLabel: 'Hesabı Sil',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success('Hesabın silindi.');
    } catch (error: any) {
      const code = error?.code as string | undefined;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Şifre yanlış.');
      } else {
        toast.error(error?.message || 'Hesap silinemedi.');
      }
    } finally {
      setDeleting(false);
    }
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
            Giriş e-posta ve şifre ile yapılır. Şifreni düzenli olarak güncellemen önerilir.
            {currentUser?.email ? `\n\nHesap: ${currentUser.email}` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <KeyRound size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitleInline}>Şifre Değiştir</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Mevcut şifre"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni şifre"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni şifre (tekrar)"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.primaryButton, changing && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={changing}
            activeOpacity={0.85}
          >
            {changing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Şifreyi Güncelle</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Trash2 size={20} color={theme.colors.error} />
            <Text style={styles.cardTitleInline}>Hesabı Sil</Text>
          </View>
          <Text style={styles.cardText}>
            Profilin ve arkadaşlık kayıtların silinir. Sohbet geçmişi sunucuda kalabilir.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Şifreni onayla"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={deletePassword}
            onChangeText={setDeletePassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Hesabımı Sil</Text>
            )}
          </TouchableOpacity>
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
      gap: 12,
    },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    cardTitle: {
      marginTop: 10,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    cardTitleInline: {
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      fontWeight: '700',
    },
    cardText: {
      marginTop: 8,
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: t.colors.textPrimary,
      backgroundColor: t.colors.surfaceAlt,
      fontSize: 15 * t.fontScale,
    },
    primaryButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
    deleteButton: {
      backgroundColor: t.colors.error,
      borderRadius: t.radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    logoutButton: {
      marginTop: 'auto',
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
