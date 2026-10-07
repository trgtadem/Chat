import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { FeedbackProvider } from './src/feedback/FeedbackContext';
import { useAuthBootstrap, useOnlinePresence } from './src/hooks/useAuthBootstrap';
import { RootNavigator } from './src/navigation/RootNavigator';
import { clearPushTokenOnLogout } from './src/services/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // On planda da goster — aksi halde testte "gelmiyor" sanilir
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppInner() {
  const { currentUser, setCurrentUser, setLogoutFn } = useAppContext();

  const handleLogout = async () => {
    try {
      if (currentUser?.id) {
        await clearPushTokenOnLogout(currentUser.id);
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

  useEffect(() => {
    setLogoutFn(handleLogout);
  }, [currentUser]);

  useOnlinePresence();
  const loading = useAuthBootstrap(setCurrentUser);

  return <RootNavigator loading={loading} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <FeedbackProvider>
            <AppInner />
          </FeedbackProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
