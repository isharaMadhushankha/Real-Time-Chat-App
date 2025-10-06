import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createContext, useState } from "react";
import { auth, db } from "../Config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();

  const [userData, setUserdata] = useState(null);
  const [chatData, setChatdata] = useState(null);
  let lastSeenInterval = null;

  const loadUserData = async (uid) => {
    console.log("🔍 loadUserData called with UID:", uid);

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("✅ Loaded user data:", userData);
        setUserdata(userData);

        // Navigate to chat (or profile if profile incomplete)
        if (userData.avatar && userData.name) {
          navigate("/chat");
        } else {
          navigate("/profile");
        }

        // Update last seen immediately
        await updateDoc(userRef, {
          lastseen: Date.now(),
        });

        // Update every 60 seconds
        lastSeenInterval = setInterval(async () => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateDoc(userRef, {
              lastseen: Date.now(),
            });
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

  const value = { userData, setUserdata, chatData, setChatdata, loadUserData };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
