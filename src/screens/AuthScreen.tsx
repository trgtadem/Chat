import React, { useState } from 'react';
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
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { User } from '../types';
import { COLORS, baseStyles } from '../styles/baseStyles';

type RootStackParamList = {
  Auth: undefined;
};

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: AuthScreenProps) {
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

  const registerForPushNotificationsAsync = async () => {
    let token;
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return null;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = tokenData.data;
      }
    } catch (error) {
      console.log('Bildirim tokeni alınamadı (Expo Go kısıtlaması olabilir):', error);
      return null;
    }
    return token;
  };

  const handleRegister = async () => {
    // 1. Boş alan kontrolü
    if (!email || !password || !name || !surname) {
      showError('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      // 2. Kullanıcıyı oluştur (Firebase otomatik giriş yapar)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Doğrulama mailini gönder
      await sendEmailVerification(user);

      // 4. KRİTİK NOKTA: Veritabanına yazma işlemi (Hala giriş yapmış durumdayız)
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email ?? '',
        name: name.trim(),
        surname: surname.trim(),
        avatar: `https://ui-avatars.com/api/?name=${name}+${surname}&background=random`,
        createdAt: serverTimestamp(),
        about: 'Merhaba, ben ChatApp kullanıyorum!',
        online: false,
        lastSeen: serverTimestamp(),
      });

      // 5. Veritabanı işlemi BİTTİKTEN SONRA çıkış yap
      await signOut(auth);

      // 6. Kullanıcıya bilgi ver ve Login ekranına dön
      Alert.alert(
        'Kayıt Başarılı',
        'Doğrulama maili gönderildi. Lütfen mailinizi onaylayıp giriş yapın.',
        [{ text: 'Tamam', onPress: () => setIsLoginMode(true) }]
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        showError('Bu email adresi zaten kullanımda.');
      } else if (error.code === 'permission-denied') {
        showError('Veritabanı yazma izni reddedildi. Lütfen internetinizi kontrol edin.');
      } else {
        showError('Kayıt hatası: ' + error.message);
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
        setNeedsVerification(true);
        return;
      }

      // Email doğrulandı, normal giriş akışı devam eder
      // App.tsx'deki onAuthStateChanged listener bunu otomatik olarak yönetecek
    } catch (error: any) {
      let errorMsg = 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        errorMsg = 'Email veya şifre hatalı.';
      }

      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        'Email Gönderildi',
        'Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.'
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
      if (error.code === 'auth/user-not-found') {
        showError('Bu email adresiyle kayıtlı kullanıcı bulunamadı.');
      } else {
        showError('Mail gönderilemedi. Lütfen tekrar deneyin.');
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
                <ArrowLeft size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Şifre Sıfırla</Text>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalCloseBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {resetSuccess ? (
              /* Başarı Ekranı */
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>✉️</Text>
                <Text style={styles.successTitle}>Mail Gönderildi!</Text>
                <Text style={styles.successText}>
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{resetEmail}</Text>
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
                  <Mail size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputAuth}
                    placeholder="Email adresiniz"
                    placeholderTextColor="#666"
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
                    <ActivityIndicator color="black" />
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

      <SafeAreaView style={baseStyles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.loginContent}>
            <View style={styles.logoContainer}>
              <MessageSquare size={64} color={COLORS.primary} />
            </View>
            <Text style={baseStyles.title}>Mesajlar</Text>

            {needsVerification ? (
              /* Verification UI */
              <View style={styles.verificationContainer}>
                <AlertCircle size={48} color={COLORS.error} style={{ marginBottom: 16 }} />
                <Text style={styles.verificationTitle}>Email Doğrulanmadı</Text>
                <Text style={styles.verificationText}>
                  Devam edebilmek için <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{email}</Text> adresine gönderilen doğrulama bağlantısına tıklamanız gerekmektedir.
                </Text>

                <TouchableOpacity
                  style={[baseStyles.button, { width: '100%', marginBottom: 12 }]}
                  onPress={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={baseStyles.buttonText}>Doğrulama Mailini Tekrar Gönder</Text>
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
                <Text style={baseStyles.subtitle}>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                {errorMessage && (
                  <View style={baseStyles.errorContainer}>
                    <AlertCircle color="#FFF" size={20} style={{ marginRight: 8 }} />
                    <Text style={baseStyles.errorText}>{errorMessage}</Text>
                  </View>
                )}
                <View style={styles.inputContainer}>
                  {!isLoginMode && (
                    <>
                      <View style={styles.inputWrapperAuth}>
                        <UserIcon size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputAuth}
                          placeholder="Ad"
                          placeholderTextColor="#666"
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                        />
                      </View>
                      <View style={styles.inputWrapperAuth}>
                        <UserIcon size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputAuth}
                          placeholder="Soyad"
                          placeholderTextColor="#666"
                          value={surname}
                          onChangeText={setSurname}
                          autoCapitalize="words"
                        />
                      </View>
                    </>
                  )}
                  <View style={styles.inputWrapperAuth}>
                    <Mail size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputAuth}
                      placeholder="Email"
                      placeholderTextColor="#666"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.inputWrapperAuth}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputAuth}
                      placeholder="Şifre"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                  {!isLoginMode && (
                    <View style={styles.inputWrapperAuth}>
                      <Lock size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputAuth}
                        placeholder="Tekrar Şifre"
                        placeholderTextColor="#666"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                      />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={baseStyles.button}
                  onPress={isLoginMode ? handleLogin : handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={baseStyles.buttonText}>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
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
                    <Text style={{ color: COLORS.primary, fontSize: 14 }}>Şifremi Unuttum?</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ marginTop: 16 }}
                  onPress={() => {
                    setIsLoginMode(!isLoginMode);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={{ color: COLORS.textSecondary }}>
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

const styles = StyleSheet.create({
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapperAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputAuth: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  // ─── Forgot Password Modal ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  verificationContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.error + '40', // 25% opacity
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  verificationText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToLoginBtn: {
    padding: 12,
  },
  backToLoginText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
