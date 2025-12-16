import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { FirebaseConfig } from '../types';

let db: any = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    // Clone config to avoid mutating the original object
    const finalConfig = { ...config };

    // Auto-fix missing databaseURL if possible
    if (!finalConfig.databaseURL && finalConfig.projectId) {
       // Default to Europe (common for EU users)
       finalConfig.databaseURL = `https://${finalConfig.projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
       console.log("Auto-configured databaseURL (EU):", finalConfig.databaseURL);
    }

    // Check if apps are already initialized to avoid duplication error
    let app;
    try {
        app = initializeApp(finalConfig);
    } catch(err: any) {
        if (err.code === 'app/duplicate-app') {
             console.warn("Firebase app already initialized.");
             return !!db; 
        }
        throw err;
    }

    db = getDatabase(app);
    console.log("Firebase initialized successfully");
    return true;
  } catch (e) {
    console.error("Firebase init failed", e);
    return false;
  }
};

export const subscribeToData = (path: string, callback: (data: any) => void, onError?: (error: any) => void) => {
  if (!db) return () => {};
  const dataRef = ref(db, path);
  
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    callback(val);
  }, (error) => {
      console.error("Firebase read failed", error);
      if (onError) onError(error);
  });
  
  return unsubscribe;
};

export const saveToFirebase = (path: string, data: any): Promise<void> => {
  if (!db) return Promise.reject("Base de données non initialisée");
  return set(ref(db, path), data);
};

export const isFirebaseInitialized = () => !!db;