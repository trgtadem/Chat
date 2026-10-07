import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  MessageSquare,
  X,
  ArrowLeft,
} from 'lucide-react-native';

import { auth, db } from '../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

import { User } from '../types';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { ensureFriendCode } from '../services/friends';
import { useFeedback } from '../feedback/FeedbackContext';

type RootStackParamList = {
  Auth: undefined;
};

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// Firebase Auth hata kodlarini kullaniciya anlasilir Turkce mesajlara cevirir.
// Bilinmeyen kodlarda gercek kodu gosterir; boylece asil sorun gizlenmez.
function mapAuthError(error: any): string {
  const code = error?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email veya şifre hatalı.';
    case 'auth/invalid-email':
      return 'Geçersiz email adresi.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı sağlanamadı. Bağlantını kontrol edip tekrar dene.';
    case 'auth/operation-not-allowed':
      return 'Email/şifre girişi bu projede etkin değil.';
    default:
      // Bilinmeyen hata: gercek kodu goster (teshis icin)
      return `Bir hata oluştu: ${code || error?.message || 'bilinmeyen'}`;
  }
}

export function AuthScreen({ navigation }: AuthScreenProps) {
  const theme = useTheme();
  const { toast } = useFeedback();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Email verification status
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const showError = (msg: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setErrorMessage(msg);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage(null);
    }, 3000);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // 1. Boş alan kontrolü
    if (!email || !password || !name || !surname) {
      showError('Lütfen tüm alanları doldurun.');
      return;
    }

<<<<<<< Updated upstream
    // 2. Email formatı kontrolü
    if (!isValidEmail(email.trim())) {
      showError('Geçerli bir email adresi girin.');
      return;
    }

    // 3. Şifre uzunluğu kontrolü (Firebase minimum 6 karakter ister)
    if (password.length < 6) {
      showError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    // 4. Şifre tekrarı kontrolü
    if (password !== confirmPassword) {
      showError('Şifreler eşleşmiyor.');
      return;
    }

=======
>>>>>>> Stashed changes
    setLoading(true);
    try {
      // 2. Kullanıcıyı oluştur (Firebase otomatik giriş yapar)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Doğrulama mailini gönder
      await sendEmailVerification(user);

<<<<<<< Updated upstream
      // 4. Kullanıcı profilini oluştur (arkadas kodu ensureFriendCode ile)
      const profile: User = {
=======
      // 4. KRİTİK NOKTA: Veritabanına yazma işlemi (Hala giriş yapmış durumdayız)
      // await kullanmazsan kod beklemez, hemen alt satıra geçer ve hata alırsın!
      await setDoc(doc(db, 'users', user.uid), {
>>>>>>> Stashed changes
        id: user.uid,
        email: user.email ?? '',
        name: name.trim(),
        surname: surname.trim(),
        avatar: `https://ui-avatars.com/api/?name=${name}+${surname}&background=random`,
<<<<<<< Updated upstream
        about: 'Merhaba, ben ChatApp kullanıyorum!',
        online: false,
        lastSeen: null,
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      try {
        await ensureFriendCode(profile);
      } catch {
        await deleteDoc(doc(db, 'users', user.uid));
        await signOut(auth);
        showError('Arkadaş kodu oluşturulamadı. Lütfen tekrar deneyin.');
        return;
      }

=======
        createdAt: serverTimestamp(),
        about: 'Merhaba, ben ChatApp kullanıyorum!',
        online: false,
        lastSeen: serverTimestamp(),
      });

>>>>>>> Stashed changes
      // 5. Veritabanı işlemi BİTTİKTEN SONRA çıkış yap
      await signOut(auth);

      // 6. Kullanıcıya bilgi ver ve Login ekranına dön
<<<<<<< Updated upstream
      toast.success(
        'Doğrulama maili gönderildi. Lütfen mailinizi onaylayıp giriş yapın.',
        'Kayıt Başarılı'
      );
      setIsLoginMode(true);
    } catch (error: any) {
      console.error('Register error:', error?.code, error?.message);
=======
      Alert.alert(
        'Kayıt Başarılı',
        'Doğrulama maili gönderildi. Lütfen mailinizi onaylayıp giriş yapın.',
        [{ text: 'Tamam', onPress: () => setIsLoginMode(true) }]
      );

    } catch (error: any) {
      // Hata yönetimi
>>>>>>> Stashed changes
      if (error.code === 'auth/email-already-in-use') {
        showError('Bu email adresi zaten kullanımda.');
      } else if (error.code === 'permission-denied') {
        showError('Veritabanı yazma izni reddedildi. Lütfen internetinizi kontrol edin.');
      } else {
<<<<<<< Updated upstream
        showError(mapAuthError(error));
=======
        showError('Kayıt hatası: ' + error.message);
>>>>>>> Stashed changes
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Lütfen email ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Email doğrulaması kontrol et
      if (!user.emailVerified) {
<<<<<<< Updated upstream
        setNeedsVerification(true);
=======
        // Hemen çıkış yapma, alert'e devam et
        Alert.alert(
          'Email Doğrulanmadı',
          'Giriş yapabilmek için email adresinizi doğrulamanız gerekiyor. Doğrulama mailini tekrar göndermek ister misiniz?',
          [
            {
              text: 'İptal',
              onPress: async () => {
                // İptal edilince çıkış yap
                await signOut(auth);
                setLoading(false);
              },
              style: 'cancel',
            },
            {
              text: 'Tekrar Gönder',
              onPress: async () => {
                try {
                  // Mail yeniden gönder
                  await sendEmailVerification(user);

                  // Başarılı mesajı göster
                  Alert.alert(
                    'Mail Gönderildi',
                    'Doğrulama mailini kontrol edin ve mailinizi onaylayıp tekrar giriş yapın.'
                  );

                  // Oturumu kapat
                  await signOut(auth);
                } catch (error: any) {
                  showError('Mail gönderilirken hata oluştu: ' + error.message);
                }
                setLoading(false);
              },
            },
          ]
        );
>>>>>>> Stashed changes
        return;
      }

      // Email doğrulandı, normal giriş akışı devam eder
      // App.tsx'deki onAuthStateChanged listener bunu otomatik olarak yönetecek
    } catch (error: any) {
<<<<<<< Updated upstream
      console.error('Login error:', error?.code, error?.message);
      showError(mapAuthError(error));
=======
      let errorMsg = 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        errorMsg = 'Email veya şifre hatalı.';
      }

      showError(errorMsg);
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success(
        'Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.',
        'Email Gönderildi'
      );
    } catch (error: any) {
      showError('E-posta gönderilemedi: ' + error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOut(auth);
    setNeedsVerification(false);
    setIsLoginMode(true);
  };

  // ─── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showError('Lütfen email adresinizi girin.');
      return;
    }
    if (!isValidEmail(resetEmail.trim())) {
      showError('Geçerli bir email adresi girin.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error?.code, error?.message);
      if (error.code === 'auth/user-not-found') {
        showError('Bu email adresiyle kayıtlı kullanıcı bulunamadı.');
      } else {
        showError(mapAuthError(error));
      }
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail('');
    setResetSuccess(false);
  };
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Şifremi Unuttum Modal ──────────────────────────────────────── */}
      <Modal
        visible={showForgotModal}
        animationType="slide"
        transparent
        onRequestClose={closeForgotModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalBackBtn}>
                <ArrowLeft size={22} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Şifre Sıfırla</Text>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalCloseBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {resetSuccess ? (
              /* Başarı Ekranı */
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>✉️</Text>
                <Text style={styles.successTitle}>Mail Gönderildi!</Text>
                <Text style={styles.successText}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{resetEmail}</Text>
                  {' '}adresine şifre sıfırlama bağlantısı gönderildi.{'\n'}Mailinizi kontrol edin.
                </Text>
                <TouchableOpacity
                  style={[styles.resetButton, { marginTop: 24 }]}
                  onPress={closeForgotModal}
                >
                  <Text style={styles.resetButtonText}>Giriş Yapmaya Dön</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Form */
              <>
                <Text style={styles.modalSubtitle}>
                  Kayıtlı email adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                </Text>
                <View style={styles.inputWrapperAuth}>
                  <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputAuth}
                    placeholder="Email adresiniz"
                    placeholderTextColor={theme.colors.textMuted}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  style={[styles.resetButton, resetLoading && { opacity: 0.7 }]}
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color={theme.colors.onAccent} />
                  ) : (
                    <Text style={styles.resetButtonText}>Sıfırlama Maili Gönder</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* ──────────────────────────────────────────────────────────────────── */}

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.loginContent}>
            <View style={styles.logoContainer}>
              <MessageSquare size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Mesajlar</Text>

            {needsVerification ? (
              /* Verification UI */
              <View style={styles.verificationContainer}>
                <AlertCircle size={48} color={theme.colors.error} style={{ marginBottom: 16 }} />
                <Text style={styles.verificationTitle}>Email Doğrulanmadı</Text>
                <Text style={styles.verificationText}>
                  Devam edebilmek için <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>{email}</Text> adresine gönderilen doğrulama bağlantısına tıklamanız gerekmektedir.
                </Text>

                <TouchableOpacity
                  style={[styles.button, { width: '100%', marginBottom: 12 }]}
                  onPress={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator color={theme.colors.onAccent} />
                  ) : (
                    <Text style={styles.buttonText}>Doğrulama Mailini Tekrar Gönder</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={handleBackToLogin}
                >
                  <Text style={styles.backToLoginText}>Giriş Ekranına Dön</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Normal Auth Form */
              <>
                <Text style={styles.subtitle}>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <AlertCircle color="#FFF" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
                <View style={styles.inputContainer}>
                  {!isLoginMode && (
                    <>
                      <View style={styles.inputWrapperAuth}>
                        <UserIcon size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputAuth}
                          placeholder="Ad"
                          placeholderTextColor={theme.colors.textMuted}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                        />
                      </View>
                      <View style={styles.inputWrapperAuth}>
                        <UserIcon size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputAuth}
                          placeholder="Soyad"
                          placeholderTextColor={theme.colors.textMuted}
                          value={surname}
                          onChangeText={setSurname}
                          autoCapitalize="words"
                        />
                      </View>
                    </>
                  )}
                  <View style={styles.inputWrapperAuth}>
                    <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputAuth}
                      placeholder="Email"
                      placeholderTextColor={theme.colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.inputWrapperAuth}>
                    <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputAuth}
                      placeholder="Şifre"
                      placeholderTextColor={theme.colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                  {!isLoginMode && (
                    <View style={styles.inputWrapperAuth}>
                      <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputAuth}
                        placeholder="Tekrar Şifre"
                        placeholderTextColor={theme.colors.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                      />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={isLoginMode ? handleLogin : handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.onAccent} />
                  ) : (
                    <Text style={styles.buttonText}>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                  )}
                </TouchableOpacity>

                {/* Şifremi Unuttum Linki */}
                {isLoginMode && (
                  <TouchableOpacity
                    style={{ marginTop: 12 }}
                    onPress={() => {
                      setResetEmail(email); // mevcut email'i modal'a taşı
                      setResetSuccess(false);
                      setShowForgotModal(true);
                    }}
                  >
                    <Text style={{ color: theme.colors.primary, fontSize: 14 }}>Şifremi Unuttum?</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ marginTop: 16 }}
                  onPress={() => {
                    setIsLoginMode(!isLoginMode);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {isLoginMode ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    title: {
      fontSize: 28 * t.fontScale,
      fontWeight: 'bold',
      color: t.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16 * t.fontScale,
      color: t.colors.textSecondary,
      marginBottom: 32,
    },
    errorContainer: {
      width: '100%',
      backgroundColor: t.colors.error,
      padding: 12,
      borderRadius: t.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    errorText: {
      color: '#FFF',
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
      flex: 1,
    },
    button: {
      width: '100%',
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.pill,
      padding: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: t.colors.onAccent,
      fontSize: 16 * t.fontScale,
      fontWeight: 'bold',
    },
    loginContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: t.colors.primary,
    },
    inputContainer: {
      width: '100%',
      marginBottom: 24,
    },
    inputWrapperAuth: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.lg,
      marginBottom: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    inputIcon: {
      marginRight: 10,
    },
    inputAuth: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16 * t.fontScale,
      color: t.colors.textPrimary,
    },
    // ─── Forgot Password Modal ───────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      padding: 24,
      paddingBottom: 40,
      minHeight: 340,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalBackBtn: {
      padding: 4,
      marginRight: 8,
    },
    modalTitle: {
      flex: 1,
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalSubtitle: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      marginBottom: 20,
      lineHeight: 20,
    },
    resetButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.pill,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    resetButtonText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 16 * t.fontScale,
    },
    successContainer: {
      alignItems: 'center',
      paddingTop: 8,
    },
    successEmoji: {
      fontSize: 52,
      marginBottom: 12,
    },
    successTitle: {
      fontSize: 22 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
      marginBottom: 12,
    },
    successText: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      textAlign: 'center',
      lineHeight: 22,
    },
    verificationContainer: {
      width: '100%',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      padding: 24,
      borderRadius: t.radius.xl,
      marginTop: 20,
      borderWidth: 1,
      borderColor: t.colors.error + '40',
    },
    verificationTitle: {
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
      marginBottom: 12,
    },
    verificationText: {
      color: t.colors.textSecondary,
      fontSize: 15 * t.fontScale,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    backToLoginBtn: {
      padding: 12,
    },
    backToLoginText: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
  });
