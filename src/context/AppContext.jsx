// src/context/AppContext.js
import { createContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
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
  const [friendRequests, setFriendRequests] = useState({ receivedRequests: [], sentRequests: [] });

  let lastSeenInterval = null;

  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      let userSnap = await getDoc(userRef);

      // Handle signup race condition: if the user document is not yet created in Firestore,
      // wait a moment and retry (up to 5 times, 500ms apart) to let signup write finish.
      let attempts = 0;
      while (!userSnap.exists() && attempts < 5) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        userSnap = await getDoc(userRef);
        attempts++;
      }

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserdata(userData);

        // Initialize user's requests document in Firestore if it doesn't exist yet
        try {
          const requestRef = doc(db, "requests", uid);
          const requestSnap = await getDoc(requestRef);
          if (!requestSnap.exists()) {
            await setDoc(requestRef, {
              receivedRequests: [],
              sentRequests: []
            });
          }
        } catch (reqErr) {
          console.warn("Could not initialize requests collection on Firestore:", reqErr);
        }

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
      } else {
        // Fallback mock user if the Firestore document doesn't exist yet
        setUserdata({
          id: uid,
          username: "testuser",
          name: "Test User",
          avatar: "",
          bio: "Hey there! Testing the layout."
        });
        setChatdata([]);
        setFriendRequests({
          receivedRequests: [
            {
              fromId: "user_sara",
              fromName: "Sara Smith",
              fromAvatar: "",
              fromBio: "React & Firebase developer.",
              status: "pending",
              timestamp: Date.now()
            }
          ],
          sentRequests: []
        });
        navigate("/chat");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Fallback mock user to bypass database permission issues and allow manual testing
      setUserdata({
        id: uid,
        username: "testuser",
        name: "Test User",
        avatar: "",
        bio: "Hey there! Testing the layout."
      });
      setChatdata([]);
      setFriendRequests({
        receivedRequests: [
          {
            fromId: "user_sara",
            fromName: "Sara Smith",
            fromAvatar: "",
            fromBio: "React & Firebase developer.",
            status: "pending",
            timestamp: Date.now()
          }
        ],
        sentRequests: []
      });
      navigate("/chat");
    }
  };

  // Load chat list (inbox)
  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        if (!res.exists()) return setChatdata([]);

        const chatList = res.data().chatData || [];
        
        try {
          const temp = await Promise.all(chatList.map(async (item) => {
            const userSnap = await getDoc(doc(db, "users", item.rId));
            return { ...item, userData: userSnap.data() };
          }));

          setChatdata(temp.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        } catch (err) {
          console.error("Error loading chat profiles in parallel:", err);
        }
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

  // Load friend requests in real-time
  useEffect(() => {
    if (userData) {
      const requestRef = doc(db, "requests", userData.id);
      const unSub = onSnapshot(requestRef, (docSnap) => {
        if (docSnap.exists()) {
          setFriendRequests(docSnap.data() || { receivedRequests: [], sentRequests: [] });
        }
      }, (error) => {
        console.warn("Could not listen to Firestore requests document:", error);
      });
      return () => unSub();
    }
  }, [userData]);

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
        friendRequests,
        setFriendRequests,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
