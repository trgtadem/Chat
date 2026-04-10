import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StatusBar,
  AppState,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { auth, db } from './firebaseConfig';
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { User } from './src/types';
import { COLORS, baseStyles } from './src/styles/baseStyles';
import { RootStackParamList } from './src/types/navigation';

// Context
import { AppProvider, useAppContext } from './src/context/AppContext';

import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ThemesScreen } from './src/screens/ThemesScreen';
import { SecurityScreen } from './src/screens/SecurityScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { BlockedUsersScreen } from './src/screens/BlockedUsersScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { StarredMessagesScreen } from './src/screens/StarredMessagesScreen';
import { ChatWallpaperScreen } from './src/screens/ChatWallpaperScreen';

// Notification Handler Setup
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const isForeground = AppState.currentState === 'active';
    return {
      shouldShowAlert: !isForeground,
      shouldPlaySound: !isForeground,
      shouldSetBadge: false,
      shouldShowBanner: !isForeground,
      shouldShowList: true,
    };
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
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
    console.log(
      'Push notification token unavailable (Expo Go limitation):',
      error
    );
    return null;
  }
  return token;
};

// ─── İç uygulama bileşeni — Context'e erişir ─────────────────────────────────
function AppInner() {
  const { currentUser, setCurrentUser, setLogoutFn } = useAppContext();
  const [loading, setLoading] = React.useState(true);

  // Logout işlemi — context'e kaydet
  const handleLogout = async () => {
    try {
      if (currentUser?.id) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          online: false,
          lastSeen: serverTimestamp(),
        });
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Logout fonksiyonunu context'e kaydet
  useEffect(() => {
    setLogoutFn(handleLogout);
  }, [currentUser]);

  // AppState değişimlerini izle (online/offline)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (auth.currentUser) {
        try {
          if (nextAppState === 'active') {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              online: true,
            });
          } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              online: false,
              lastSeen: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Auth durumu izle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser && authUser.emailVerified) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;

            if (!userData.id) {
              userData.id = authUser.uid;
            }

            // Push token güncelle
            const newToken = await registerForPushNotificationsAsync();
            if (newToken && newToken !== userData?.pushToken) {
              await updateDoc(doc(db, 'users', authUser.uid), {
                pushToken: newToken,
              });
              userData.pushToken = newToken;
            }

            await updateDoc(doc(db, 'users', authUser.uid), { online: true });

            setCurrentUser(userData);
            setLoading(false);
          } else {
            // User exists in Auth but not in Firestore - this shouldn't happen normally
            // but if it does, we shouldn't let them in.
            await signOut(auth);
            setCurrentUser(null);
            setLoading(false);
          }
        } catch (error: any) {
          Alert.alert('Data Retrieval Error', error.message);
          setLoading(false);
        }
      } else {
        // If user is not logged in OR email is not verified, set currentUser to null
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          baseStyles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.textPrimary,
          border: COLORS.border,
          notification: COLORS.error,
        },
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {currentUser ? (
          <>
            {/* Home — currentUser context'ten geliyor, prop drilling yok */}
            <Stack.Screen name="Home" component={HomeScreen} />
            {/* Chat — currentUser context'ten geliyor */}
            <Stack.Screen name="Chat" component={ChatScreen} />
            {/* Profile — currentUser context'ten geliyor */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Themes" component={ThemesScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="StarredMessages" component={StarredMessagesScreen} />
            <Stack.Screen name="ChatWallpaper" component={ChatWallpaperScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Kök bileşen — AppProvider sarar ─────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
