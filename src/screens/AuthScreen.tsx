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
} from 'lucide-react-native';

import { auth, db } from '../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
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
    // await kullanmazsan kod beklemez, hemen alt satıra geçer ve hata alırsın!
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
    // Hata yönetimi
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

  return (
    <SafeAreaView style={baseStyles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.logoContainer}>
            <MessageSquare size={64} color={COLORS.primary} />
          </View>
          <Text style={baseStyles.title}>Mesajlar</Text>
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
          <TouchableOpacity style={baseStyles.button} onPress={isLoginMode ? handleLogin : handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={baseStyles.buttonText}>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {
            setIsLoginMode(!isLoginMode);
            setErrorMessage(null);
          }}>
            <Text style={{ color: COLORS.textSecondary }}>
              {isLoginMode ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
});
