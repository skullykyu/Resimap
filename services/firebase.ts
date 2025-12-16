import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { FirebaseConfig } from '../types';

let db: any = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    // Check if apps are already initialized to avoid duplication error
    const app = initializeApp(config);
    db = getDatabase(app);
    console.log("Firebase initialized successfully");
    return true;
  } catch (e) {
    console.error("Firebase init failed", e);
    return false;
  }
};

export const subscribeToData = (path: string, callback: (data: any) => void) => {
  if (!db) return () => {};
  const dataRef = ref(db, path);
  
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    callback(val);
  });
  
  return unsubscribe;
};

export const saveToFirebase = (path: string, data: any) => {
  if (!db) return;
  set(ref(db, path), data)
    .catch((error) => console.error("Firebase save error:", error));
};

export const isFirebaseInitialized = () => !!db;