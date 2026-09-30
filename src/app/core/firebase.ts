import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore, getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn('Firebase initialization note:', error);
  app = getApps()[0] || initializeApp(environment.firebase);
  auth = getAuth(app);
  try {
    db = getFirestore(app);
  } catch (dbErr) {
    console.warn('Firestore fallback note:', dbErr);
  }
}

export { app, auth, db };

