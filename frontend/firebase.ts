import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB-gEptk_-8sUk-bcb68AyhNC8Koslf0AE",
  authDomain: "glucose-3f1ef.firebaseapp.com",
  projectId: "glucose-3f1ef",
  storageBucket: "glucose-3f1ef.firebasestorage.app",
  messagingSenderId: "1044803048735",
  appId: "1:1044803048735:web:6837b6c86247264c668c2a",
  measurementId: "G-G3HEB0EKVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };