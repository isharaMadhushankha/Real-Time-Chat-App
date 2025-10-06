// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

// ✅ Corrected Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2buMtfv4uNoRK3JSCdjjRt7WeIkr-Aa8",
  authDomain: "chat-app-a5534.firebaseapp.com",
  projectId: "chat-app-a5534",
  // ✅ Fixed: changed from .firebasestorage.app → .appspot.com
  storageBucket: "chat-app-a5534.appspot.com",
  messagingSenderId: "696418930691",
  appId: "1:696418930691:web:00e86a86868b2cbed77e36",
  measurementId: "G-BW3MCBWJ1K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ==============================
// 🔐 Authentication Functions
// ==============================

// Sign up new user
const signup = async (username, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Create a Firestore document for the new user
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey there! I am using Chat App.",
      lastseen: Date.now(),
    });

    // Initialize user chat data
    await setDoc(doc(db, "chats", user.uid), {
      chatData: [],
    });

    toast.success("Account created successfully!");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

// Login existing user
const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful!");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

// Logout user
const logout = async () => {
  try {
    await signOut(auth);
    toast.info("Logged out successfully!");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

// Export modules
export { signup, login, logout, auth, db };
