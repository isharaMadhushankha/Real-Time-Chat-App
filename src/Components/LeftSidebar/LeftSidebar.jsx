import React, { useContext, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../Config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { userData, chatData } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // 🔍 Search for user by username
  const inputHandler = async (e) => {
    try {
      const input = e.target.value.trim().toLowerCase();

      if (input === "") {
        setShowSearch(false);
        setUser(null);
        return;
      }

      setShowSearch(true);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", input));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const foundUser = querySnap.docs[0].data();

        // Check if already in chat list
        const userExist = chatData.some((chat) => chat.rId === foundUser.id);

        // Prevent showing self or existing chat user
        if (!userExist && foundUser.id !== userData.id) {
          setUser(foundUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("🔥 Error searching user:", error);
      toast.error("Failed to search user");
    }
  };

  // 💬 Create new chat
  const addChat = async () => {
    if (!user) return;
    try {
      const messageRef = collection(db, "messages");
      const chatRef = collection(db, "chats");

      // Create a new empty messages document
      const newMessageRef = doc(messageRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Add chat entry for current user
      await updateDoc(doc(chatRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      // Add chat entry for the receiver
      await updateDoc(doc(chatRef, user.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: false,
        }),
      });

      toast.success("Chat created successfully!");
      setUser(null);
      setShowSearch(false);
    } catch (error) {
      console.error("🔥 Error creating chat:", error);
      toast.error(error.message);
    }
  };

  const setChat = async (item)=>{
    console.log(item);
  }
  
  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search here..."
          />
        </div>
      </div>

      <div className="ls-list">
        {showSearch ? (
          user ? (
            <div className="friend" onClick={addChat}>
              <img src={user.avatar || assets.profile_img} alt="" />
              <div>
                <p>{user.username}</p>
                <span>{user.bio || "No bio available"}</span>
              </div>
            </div>
          ) : (
            <p className="no-user">No user found</p>
          )
        ) : chatData && chatData.length > 0 ? (
          chatData.map((item, index) => (
            <div onClick={()=>setChat(item)} key={index} className="friend">
              <img src={item.userData.avatar || assets.profile_img} alt="" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage || "No messages yet"}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-chats">No chats available</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
