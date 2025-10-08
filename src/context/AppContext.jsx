// src/context/AppContext.js
import { createContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../Config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const [userData, setUserdata] = useState(null);
  const [chatData, setChatdata] = useState([]);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatuser, setChatuser] = useState(null);

  let lastSeenInterval = null;

  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserdata(userData);

        if (userData.avatar && userData.name) {
          navigate("/chat");
        } else {
          navigate("/profile");
        }

        await updateDoc(userRef, { lastseen: Date.now() });
        lastSeenInterval = setInterval(async () => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateDoc(userRef, { lastseen: Date.now() });
          } else {
            clearInterval(lastSeenInterval);
          }
        }, 60000);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Load chat list (inbox)
  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        if (!res.exists()) return setChatdata([]);

        const chatList = res.data().chatData || [];
        const temp = [];

        for (const item of chatList) {
          try {
            const userSnap = await getDoc(doc(db, "users", item.rId));
            temp.push({ ...item, userData: userSnap.data() });
          } catch (err) {
            console.error("Error loading chat user:", err);
          }
        }

        setChatdata(temp.sort((a, b) => b.updateAt - a.updateAt));
      });

      return () => unSub();
    }
  }, [userData]);

  // Load messages when messagesId changes
  useEffect(() => {
    if (!messagesId) return;
    const msgRef = doc(db, "messages", messagesId);
    const unsub = onSnapshot(msgRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [messagesId]);

  return (
    <AppContext.Provider
      value={{
        userData,
        setUserdata,
        chatData,
        setChatdata,
        loadUserData,
        messages,
        setMessages,
        messagesId,
        setMessagesId,
        chatuser,
        setChatuser,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
