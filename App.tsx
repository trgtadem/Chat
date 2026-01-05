import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  UIManager,
  AppState,
  BackHandler, // Geri tuşu için
  Alert
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { 
  Send, 
  MessageCircle, 
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ChevronLeft,
  MessageSquare,
  Check, // Tik işareti için
  CheckCheck, // Çift tik için
  Paperclip
} from "lucide-react-native";

import { auth, db } from "./firebaseConfig"; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth"; 
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, updateDoc, where, writeBatch, getDocs, limit } from "firebase/firestore"; 

// Bildirim Ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import { User, Message } from "./src/types";

import { AuthScreen } from "./src/screens/AuthScreen";
import { COLORS, baseStyles } from './src/styles/baseStyles';

import { HomeScreen } from './src/screens/HomeScreen';
import { getChatId, formatTime, formatLastSeen } from './src/utils';

// ==================== BİLDİRİM GÖNDERME FONKSİYONU ====================
async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

import { ChatScreen } from "./src/screens/ChatScreen";

// ==================== MAIN APP ====================
export default function App() {
  const [activeScreen, setActiveScreen] = useState<"AUTH" | "HOME" | "CHAT">("AUTH");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ANDROID GERİ TUŞU KONTROLÜ
  useEffect(() => {
    const backAction = () => {
      if (activeScreen === "CHAT") {
        setActiveScreen("HOME");
        setSelectedFriend(null);
        return true; // Varsayılan geri işlemini engelle
      } else if (activeScreen === "HOME") {
        BackHandler.exitApp(); // Uygulamadan çık
        return true;
      } else if (activeScreen === "AUTH") {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeScreen]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (auth.currentUser) {
        if (nextAppState === 'active') {
          await updateDoc(doc(db, "users", auth.currentUser.uid), { online: true });
        } else if (nextAppState === 'background') {
          await updateDoc(doc(db, "users", auth.currentUser.uid), { online: false });
          await updateDoc(doc(db, "users", auth.currentUser.uid), { online: false, lastSeen: serverTimestamp() });
        }
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setLoading(true);
        let attempts = 0;
        const fetchUser = async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", authUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              // Token güncelle (Değişmiş olabilir)
              const newToken = await registerForPushNotificationsAsync();
              if (newToken && newToken !== userData.pushToken) {
                  await updateDoc(doc(db, "users", authUser.uid), { pushToken: newToken });
                  userData.pushToken = newToken;
              }
              
              setCurrentUser(userData);
              setActiveScreen("HOME");
              await updateDoc(doc(db, "users", authUser.uid), { online: true });
              setLoading(false);
            } else {
              Alert.alert(
                "Giriş Hatası",
                "Kimlik doğrulama başarılı ancak veritabanında kullanıcı kaydınız bulunamadı. Lütfen yeni bir hesap oluşturun veya yönetici ile iletişime geçin."
              );
              // Kullanıcıyı hayalet durumda bırakmamak için çıkış yaptır
              await signOut(auth);
              setActiveScreen("AUTH");
              setLoading(false);
            }
          } catch (e: any) { 
              Alert.alert("Veri Çekme Hatası", e.message);
              setLoading(false); 
          }
        };
        fetchUser();
      } else {
        setActiveScreen("AUTH");
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth ekranında kullanılacak token fonksiyonu
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default', importance: Notifications.AndroidImportance.MAX,
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
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = tokenData.data;
      } catch (error) { return null; }
    }
    return token;
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, "users", currentUser.id), { online: false });
        await updateDoc(doc(db, "users", currentUser.id), { online: false, lastSeen: serverTimestamp() });
        await signOut(auth);
      } catch (error) { console.error(error) }
    }
  };

  const handleSelectChat = (friend: User) => {
    setSelectedFriend(friend);
    setActiveScreen("CHAT");
  };

  if (loading) {
    return (
      <View style={[baseStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
          <View style={baseStyles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          {activeScreen === "AUTH" && <AuthScreen onLoginSuccess={() => {}} />}
          {activeScreen === "HOME" && currentUser && <HomeScreen currentUser={currentUser} onSelectChat={handleSelectChat} onLogout={handleLogout} />}
          {activeScreen === "CHAT" && selectedFriend && currentUser && <ChatScreen user={currentUser} friend={selectedFriend} onBack={() => setActiveScreen("HOME")} />}
          </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
