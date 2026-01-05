import React, { useState, useEffect } from 'react';
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
import { NavigationContainer } from '@react-navigation/native';
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

import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Notification Handler Setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Chat: { user: User; friend: User };
  Profile: { user: User };
};

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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle AppState changes for online/offline status
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

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;

            // Update push token if changed
            const newToken = await registerForPushNotificationsAsync();
            if (newToken && newToken !== userData.pushToken) {
              await updateDoc(doc(db, 'users', authUser.uid), {
                pushToken: newToken,
              });
              userData.pushToken = newToken;
            }

            // Set online status
            await updateDoc(doc(db, 'users', authUser.uid), { online: true });

            setCurrentUser(userData);
            setLoading(false);
          } else {
            Alert.alert(
              'Login Error',
              'User account not found in database. Please create a new account or contact support.'
            );
            await signOut(auth);
            setLoading(false);
          }
        } catch (error: any) {
          Alert.alert('Data Retrieval Error', error.message);
          setLoading(false);
        }
      } else {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            {currentUser ? (
              <>
                <Stack.Screen
                  name="Home"
                  options={{}}
                >
                  {(props) => (
                    <HomeScreen
                      currentUser={currentUser}
                      onLogout={async () => {
                        try {
                          await updateDoc(doc(db, 'users', currentUser.id), {
                            online: false,
                            lastSeen: serverTimestamp(),
                          });
                          await signOut(auth);
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      {...props}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="Chat"
                  options={{}}
                >
                  {(props) => (
                    <ChatScreen
                      currentUser={currentUser}
                      {...props}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="Profile"
                  options={{}}
                >
                  {(props) => (
                    <ProfileScreen
                      currentUser={currentUser}
                      onUserUpdate={setCurrentUser}
                      {...props}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <Stack.Screen
                name="Auth"
                options={{}}
              >
                {(props) => <AuthScreen {...props} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
