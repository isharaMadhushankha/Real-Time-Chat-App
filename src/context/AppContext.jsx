import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../Config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();

  const [userData, setUserdata] = useState(null);
  const [chatData, setChatdata] = useState(null);
  const [messagesId,setMessagesId] = useState(null);
  const  [messages,setMessages] = useState([]);
  const [chatuser,setChatuser ]= useState(null);

  let lastSeenInterval = null;

  // 🔹 Load user data from Firestore
  const loadUserData = async (uid) => {
    console.log("🔍 loadUserData called with UID:", uid);

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("✅ Loaded user data:", userData);
        setUserdata(userData);

        // Navigate based on profile completion
        if (userData.avatar && userData.name) {
          navigate("/chat");
        } else {
          navigate("/profile");
        }

        // Update last seen immediately
        await updateDoc(userRef, { lastseen: Date.now() });

        // Keep updating every 60 seconds
        lastSeenInterval = setInterval(async () => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateDoc(userRef, { lastseen: Date.now() });
          } else {
            clearInterval(lastSeenInterval);
          }
        }, 60000);
      } else {
        console.warn("⚠️ No user document found in Firestore for UID:", uid);
      }
    } catch (error) {
      console.error("🔥 Error loading user data:", error);
    }
  };

  // 🔹 Realtime chat listener
  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        if (!res.exists()) {
          console.warn("⚠️ No chat document found for user:", userData.id);
          setChatdata([]);
          return;
        }

        const chatImages = res.data().chatData || []; // ✅ Safety check
        console.log("💬 Chat snapshot:", chatImages);

        const tempData = [];

        for (const item of chatImages) {
          try {
            const userRef = doc(db, "users", item.rId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            tempData.push({ ...item, userData });
          } catch (err) {
            console.error("❌ Error loading chat user data:", err);
          }
        }

        // Sort chats by update time (descending)
        setChatdata(tempData.sort((a, b) => b.updateAt - a.updateAt));
      });

      return () => {
        unSub();
      };
    }
  }, [userData]);

  const value = { userData, setUserdata, chatData, setChatdata, loadUserData };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
