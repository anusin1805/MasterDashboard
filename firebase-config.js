import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1hVvK7Yd3qB1Ud3mbIKd_edq4XmH-PVI",
  authDomain: "brave-calling-398109.firebaseapp.com",
  projectId: "brave-calling-398109",
  storageBucket: "brave-calling-398109.firebasestorage.app",
  messagingSenderId: "118774845365",
  appId: "1:118774845365:web:99841a1b01f387a48ed3fc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
