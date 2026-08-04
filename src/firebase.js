import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBx0NKWqs18QtM0TbcLtRxyLdNoagjRVNE",
  authDomain: "university-events-847c1.firebaseapp.com",
  projectId: "university-events-847c1",
  storageBucket: "university-events-847c1.firebasestorage.app",
  messagingSenderId: "539838284880",
  appId: "1:539838284880:web:65a7491bb68580a7ab7d55",
  measurementId: "G-GGLZ354X4Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);