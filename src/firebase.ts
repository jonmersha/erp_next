import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-config.json';

const app = !getApps().length ? initializeApp({
  ...firebaseConfig,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey
}) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
