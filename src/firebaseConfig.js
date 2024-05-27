

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, child, push, update } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc-5YV2a7td9LW1NPNnSeEHa54tIlMkJQ",
  authDomain: "bookpedia-3f12b.firebaseapp.com",
  projectId: "bookpedia-3f12b",
  storageBucket: "bookpedia-3f12b.appspot.com",
  messagingSenderId: "47086075128",
  appId: "1:47086075128:web:6e50f8f883f3ac999a4f0d",
  measurementId: "G-9LNTRP3WBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);

export { createUserWithEmailAndPassword };
export { signInWithEmailAndPassword };
export { onAuthStateChanged };
export { signOut };
export { sendPasswordResetEmail };
export { getAuth };

export { getDatabase, app, ref, set, get, onValue};
export { storage, getStorage, uploadBytes, getDownloadURL, storageRef, listAll,  child, push, update};