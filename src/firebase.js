import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const remoteConfig = getRemoteConfig(app);
const storage = getStorage(app);

remoteConfig.settings.minimumFetchIntervalMillis = 30000; // 30 segundos para desarrollo
remoteConfig.settings.fetchTimeoutMillis = 60000;
export const auth = getAuth(app);
export const db = getFirestore(app);
export { remoteConfig, fetchAndActivate, getValue };
export {
  storage, ref, uploadBytes, getDownloadURL,
};
export default app;
