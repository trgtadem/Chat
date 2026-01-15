import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // expo-constants'ı import et

const firebaseConfig = {
  apiKey: "AIzaSyB7rAC1pAWYWPsuXW_BtCV-2RlLcbUuas4",
  authDomain: "mobilapp-b46ba.firebaseapp.com",
  projectId: "mobilapp-b46ba",
  storageBucket: "mobilapp-b46ba.firebasestorage.app",
  messagingSenderId: "610020027674",
  appId: "1:610020027674:web:083f1a51b258579b6250a3",
  measurementId: "G-C38FFN206H"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };