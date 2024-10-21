// /firebase/firebase-init.js

import { initializeApp } from "./firebase-app.js";
import { getAuth } from "./firebase-auth.js";
import {
  PROJECT_ID,
  FIREBASE_API_KEY,
  SENDER_ID,
  APP_ID,
} from "./firebase-secrets.js";

// Firebase configuration (you will get these from your Firebase console)
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  messagingSenderId: SENDER_ID,
  appId: APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth instance
export const auth = getAuth(app);
