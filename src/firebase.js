import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your actual Firebase configuration.
// Note: these values (including apiKey) are meant to be public — Firebase
// uses them to identify your project, not as a secret. Your real
// protection is Firestore security rules + App Check below.
const firebaseConfig = {
  apiKey: "AIzaSyBx0NKWqs18QtM0TbcLtRxyLdNoagjRVNE",
  authDomain: "university-events-847c1.firebaseapp.com",
  projectId: "university-events-847c1",
  storageBucket: "university-events-847c1.firebasestorage.app",
  messagingSenderId: "539838284880",
  appId: "1:539838284880:web:65a7491bb68580a7ab7d55",
  measurementId: "G-GGLZ354X4Z",
};

const app = initializeApp(firebaseConfig);

// ---- Firebase App Check --------------------------------------------------
// This is the single most effective change against scripted abuse: it makes
// Firestore reject any read/write that doesn't come with a fresh, valid
// attestation token from either reCAPTCHA v3 (real browser) or a debug
// token (local dev). A script hitting the Firestore REST/SDK API directly
// with just your public apiKey — which is what someone would do to bypass
// your UI — gets blocked before your security rules even run.
//
// Setup steps (one-time, in the Firebase console, project
// "university-events-847c1"):
//   1. Build > App Check > register your web app > choose reCAPTCHA v3.
//   2. Create a reCAPTCHA v3 site key at https://www.google.com/recaptcha/admin
//      for domains: events-uop.onrender.com (and localhost for dev).
//   3. Paste that site key below, replacing RECAPTCHA_V3_SITE_KEY.
//   4. In App Check > APIs, turn on "Enforce" for Cloud Firestore — but only
//      AFTER confirming the App Check console shows verified requests
//      coming in (leave it in monitor-only mode first). Enforcing too early
//      can lock out your own real users.
//   5. For local development, reCAPTCHA v3 doesn't run cleanly on
//      localhost — the debug-token block below auto-generates one; copy it
//      from your browser console the first time you run `npm start` and
//      add it under App Check > Manage debug tokens in the Firebase
//      console so local requests are accepted.
const RECAPTCHA_V3_SITE_KEY = "YOUR_RECAPTCHA_V3_SITE_KEY";

if (typeof window !== "undefined") {
  if (process.env.NODE_ENV !== "production") {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;