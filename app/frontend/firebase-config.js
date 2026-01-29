// Firebase Configuration and Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCs5ZS7KwgVSWyIhpFGE948S33CJQziwJQ",
  authDomain: "medical-assistent-d72cb.firebaseapp.com",
  projectId: "medical-assistent-d72cb",
  storageBucket: "medical-assistent-d72cb.appspot.com",
  messagingSenderId: "781586114084",
  appId: "1:781586114084:web:74cbabf0f6fdeefc595ab1",
  measurementId: "G-TMGR37THB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, orderBy, limit, ref, uploadBytes, getDownloadURL };