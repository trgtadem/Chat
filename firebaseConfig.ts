import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
// @ts-ignore: Firebase v11+ typing issue for getReactNativePersistence in React Native
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Strict validation of configuration
const validateConfig = (config: typeof firebaseConfig) => {
  const missingKeys = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'measurementId') // measurementId is optional
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase Configuration Error: Missing environment variables: ${missingKeys.join(', ')}. ` +
      `Check your .env file and ensure EXPO_PUBLIC_ prefix is used.`
    );
  }
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const shouldInitializeAppCheck =
  process.env.NODE_ENV !== 'test' &&
  Platform.OS === 'web' &&
  typeof document !== 'undefined';

try {
  validateConfig(firebaseConfig);

  // Prevent re-initialization
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // ReCAPTCHA-based App Check is browser-only; skip it on native runtimes.
    if (shouldInitializeAppCheck) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY'),
        isTokenAutoRefreshEnabled: true,
      });
    }

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } else {
    app = getApp();
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  }

  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  throw error;
}

export { auth, db, storage };
