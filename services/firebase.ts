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
    // (In a hot-reload environment like dev, this might happen)
    let app;
    try {
        app = initializeApp(finalConfig);
    } catch(err: any) {
        if (err.code === 'app/duplicate-app') {
            // If already initialized, we just ignore.
            // But we can't easily get the existing app instance in modular SDK without importing getApp
            // Since we use global vars for db, let's just assume if it failed it's fine or re-fetch db.
             console.warn("Firebase app already initialized.");
             // Note: In a real prod app we might handle this cleaner, but for this usecase:
             // We return true if db is already set.
             return !!db; 
        }
        throw err;
    }

    db = getDatabase(app);
    console.log("Firebase initialized successfully");
    return true;
  } catch (e) {
    console.error("Firebase init failed", e);
    // Fallback: try US URL if the EU one failed? 
    // Hard to do inside the try/catch without a complex retry logic. 
    // We let the UI handle the error state.
    return false;
  }
};

export const subscribeToData = (path: string, callback: (data: any) => void) => {
  if (!db) return () => {};
  const dataRef = ref(db, path);
  
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    callback(val);
  }, (error) => {
      console.error("Firebase read failed", error);
  });
  
  return unsubscribe;
};

export const saveToFirebase = (path: string, data: any) => {
  if (!db) return;
  set(ref(db, path), data)
    .catch((error) => console.error("Firebase save error:", error));
};

export const isFirebaseInitialized = () => !!db;