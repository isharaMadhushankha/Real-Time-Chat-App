import React, { useContext, useState, useEffect } from "react";
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
  const { userData, chatData, setChatuser, setMessagesId } = useContext(AppContext);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch all registered users except the current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("id", "!=", userData.id));
        const querySnap = await getDocs(usersRef);

        // Filter out current user from the list
        const usersList = querySnap.docs
          .map((doc) => doc.data())
          .filter((user) => user.id !== userData.id);

        setAllUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (userData?.id) {
      fetchUsers();
    }
  }, [userData]);

  // Create or open chat with selected user
  const addChat = async (selectedUser) => {
    if (!selectedUser) return;

    try {
      const chatsRef = collection(db, "chats");
      const messagesRef = collection(db, "messages");

      // Check if chat already exists between users in current user's chatData
      const existingChat = chatData.find(
        (chat) => chat.rId === selectedUser.id
      );

      if (existingChat) {
        // Chat exists: just open it
        setChatuser(selectedUser);
        setMessagesId(existingChat.messageId);
        return;
      }

      // Create new messages doc
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Add chat entry for current user
      await updateDoc(doc(chatsRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: selectedUser.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      // Add chat entry for selected user
      await updateDoc(doc(chatsRef, selectedUser.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: false,
        }),
      });

      toast.success("Chat created successfully!");

      // Open the new chat
      setChatuser(selectedUser);
      setMessagesId(newMessageRef.id);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="" />
          {/* Your existing menu code */}
        </div>

        {/* Remove search bar or keep if you want */}
      </div>

      <div className="ls-list">
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : allUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          allUsers.map((user) => (
            <div key={user.id} className="friend" onClick={() => addChat(user)}>
              <img src={user.avatar || assets.profile_img} alt={user.username} />
              <div>
                <p>{user.name || user.username}</p>
                <span>{user.bio || "No bio available"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
