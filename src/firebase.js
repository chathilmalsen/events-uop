import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";

// Firebase web config values are not secret — your actual security comes
// from Firestore/Storage security rules, not from hiding this object.
// These hardcoded values are used as a fallback so the app still works
// even if VITE_FIREBASE_* environment variables aren't set on whatever
// host is serving the build (e.g. Render). If the env vars ARE set
// (as they are for the Firebase Hosting build), those take priority.
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBx0NKWqs18QtM0TbcLtRxyLdNoagjRVNE",
  authDomain: "university-events-847c1.firebaseapp.com",
  projectId: "university-events-847c1",
  storageBucket: "university-events-847c1.firebasestorage.app",
  messagingSenderId: "539838284880",
  appId: "1:539838284880:web:65a7491bb68580a7ab7d55",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_FIREBASE_CONFIG.appId,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missing.length) {
  throw new Error(
    `Missing Firebase environment variables: ${missing.join(", ")}`
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Keep authentication persistent across browser restarts.
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Could not enable Firebase auth persistence:", error);
});

// App Check is optional until you put your reCAPTCHA v3 site key in .env.
// After verifying it works, enable App Check enforcement in the Firebase
// console for Firestore and Storage.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("Firebase App Check could not initialize:", error);
  }
}