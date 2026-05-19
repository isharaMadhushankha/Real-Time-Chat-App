import React, { useContext, useState, useEffect } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../Config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

// Professional React Icons
import { BsThreeDotsVertical, BsPinAngleFill, BsPinAngle } from "react-icons/bs";
import { FiUserX } from "react-icons/fi";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { 
    userData, 
    chatData, 
    setChatdata, 
    setChatuser, 
    chatuser,
    setMessagesId,
    messagesId,
    friendRequests,
    setFriendRequests
  } = useContext(AppContext);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch all registered users except the current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const querySnap = await getDocs(usersRef);

        // Filter out current user from the list
        const usersList = querySnap.docs
          .map((doc) => doc.data())
          .filter((user) => user.id !== userData?.id);

        setAllUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.info("Database restricted. Loaded simulated friends for testing!");
        // Premium Mock Friends fallback so user can test the app
        setAllUsers([
          {
            id: "user_ishara",
            username: "ishara_madushanka",
            name: "Ishara Madushanka",
            avatar: "",
            bio: "Hey there! I am using Chat App."
          },
          {
            id: "user_john",
            username: "john_doe",
            name: "John Doe",
            avatar: "",
            bio: "Building something awesome! 🚀"
          },
          {
            id: "user_sara",
            username: "sara_smith",
            name: "Sara Smith",
            avatar: "",
            bio: "React & Firebase developer."
          }
        ]);
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
        setActiveTab("chats");
        resetUnreadCount(existingChat.messageId);
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
          unreadCount: 0,
          pinned: false
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
          unreadCount: 0,
          pinned: false
        }),
      });

      toast.success("Chat created successfully!");

      // Open the new chat
      setChatuser(selectedUser);
      setMessagesId(newMessageRef.id);
      setActiveTab("chats");
    } catch (error) {
      console.warn("Firestore error, creating a local mock chat for testing:", error);
      
      // Fallback: Create mock chat locally in memory
      const mockMessageId = `mock_msg_${selectedUser.id}`;
      const mockChatEntry = {
        messageId: mockMessageId,
        lastMessage: "Click to view simulated messages!",
        rId: selectedUser.id,
        updatedAt: Date.now(),
        messageSeen: true,
        unreadCount: 0,
        pinned: false,
        userData: selectedUser
      };
      
      // Update local chatData state in AppContext
      if (!chatData.some(chat => chat.rId === selectedUser.id)) {
        setChatdata(prev => [...prev, mockChatEntry]);
      }
      
      // Open the new chat locally
      setChatuser(selectedUser);
      setMessagesId(mockMessageId);
      setActiveTab("chats");
      toast.success(`Started simulated chat with ${selectedUser.name}!`);
    }
  };

  // ✉️ Send Friend Request
  const sendFriendRequest = async (targetUser) => {
    try {
      const selfRequestRef = doc(db, "requests", userData.id);
      const targetRequestRef = doc(db, "requests", targetUser.id);

      // Add to target's receivedRequests
      await updateDoc(targetRequestRef, {
        receivedRequests: arrayUnion({
          fromId: userData.id,
          fromName: userData.name || userData.username,
          fromAvatar: userData.avatar || "",
          fromBio: userData.bio || "Hey there!",
          status: "pending",
          timestamp: Date.now()
        })
      });

      // Add to self's sentRequests
      await updateDoc(selfRequestRef, {
        sentRequests: arrayUnion({
          toId: targetUser.id,
          status: "pending",
          timestamp: Date.now()
        })
      });

      toast.success(`Friend request sent to ${targetUser.name || targetUser.username}!`);
    } catch (error) {
      console.warn("Error sending request, using mock local fallback:", error);
      
      // Fallback
      setFriendRequests(prev => ({
        ...prev,
        sentRequests: [...(prev.sentRequests || []), { toId: targetUser.id, status: "pending", timestamp: Date.now() }]
      }));
      toast.success(`Simulated friend request sent to ${targetUser.name}!`);
    }
  };

  // ✅ Accept Friend Request
  const acceptFriendRequest = async (request) => {
    try {
      const chatsRef = collection(db, "chats");
      const messagesRef = collection(db, "messages");
      
      // 1. Create a new message room
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // 2. Add chat entry to both users' chat lists
      await updateDoc(doc(chatsRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: request.fromId,
          updatedAt: Date.now(),
          messageSeen: true,
          unreadCount: 0,
          pinned: false
        }),
      });

      await updateDoc(doc(chatsRef, request.fromId), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: false,
          unreadCount: 0,
          pinned: false
        }),
      });

      // 3. Remove from receivedRequests for current user
      const selfRequestRef = doc(db, "requests", userData.id);
      await updateDoc(selfRequestRef, {
        receivedRequests: arrayRemove(request)
      });

      // 4. Remove from sentRequests for sender
      const targetRequestRef = doc(db, "requests", request.fromId);
      const targetSnap = await getDoc(targetRequestRef);
      if (targetSnap.exists()) {
        const sentList = targetSnap.data().sentRequests || [];
        const match = sentList.find(r => r.toId === userData.id);
        if (match) {
          await updateDoc(targetRequestRef, {
            sentRequests: arrayRemove(match)
          });
        }
      }

      toast.success("Friend request accepted!");
    } catch (error) {
      console.warn("Error accepting request, using mock local fallback:", error);

      // Local mock fallback: Add chat to chatData
      const mockMessageId = `mock_msg_${request.fromId}`;
      const mockChatEntry = {
        messageId: mockMessageId,
        lastMessage: "No messages yet",
        rId: request.fromId,
        updatedAt: Date.now(),
        messageSeen: true,
        unreadCount: 0,
        pinned: false,
        userData: {
          id: request.fromId,
          username: request.fromName.toLowerCase().replace(/\s+/g, ""),
          name: request.fromName,
          avatar: request.fromAvatar || "",
          bio: request.fromBio || "Hey there!"
        }
      };

      if (!chatData.some(chat => chat.rId === request.fromId)) {
        setChatdata(prev => [...prev, mockChatEntry]);
      }

      // Remove from local receivedRequests
      setFriendRequests(prev => ({
        ...prev,
        receivedRequests: (prev.receivedRequests || []).filter(req => req.fromId !== request.fromId)
      }));

      // Open new chat
      setChatuser(mockChatEntry.userData);
      setMessagesId(mockMessageId);
      setActiveTab("chats");
      toast.success(`Simulated friend request accepted! Chat with ${request.fromName} started!`);
    }
  };

  // ❌ Decline Friend Request
  const declineFriendRequest = async (request) => {
    try {
      // 1. Remove from receivedRequests for current user
      const selfRequestRef = doc(db, "requests", userData.id);
      await updateDoc(selfRequestRef, {
        receivedRequests: arrayRemove(request)
      });

      // 2. Remove from sentRequests for sender
      const targetRequestRef = doc(db, "requests", request.fromId);
      const targetSnap = await getDoc(targetRequestRef);
      if (targetSnap.exists()) {
        const sentList = targetSnap.data().sentRequests || [];
        const match = sentList.find(r => r.toId === userData.id);
        if (match) {
          await updateDoc(targetRequestRef, {
            sentRequests: arrayRemove(match)
          });
        }
      }

      toast.info("Friend request declined");
    } catch (error) {
      console.warn("Error declining request, using mock local fallback:", error);
      
      // Remove from local receivedRequests
      setFriendRequests(prev => ({
        ...prev,
        receivedRequests: (prev.receivedRequests || []).filter(req => req.fromId !== request.fromId)
      }));
      toast.info("Simulated friend request declined.");
    }
  };

  // 📌 Pin / Unpin Chat Room
  const togglePinChat = async (chatItem) => {
    try {
      const chatRef = doc(db, "chats", userData.id);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatsList = chatSnap.data().chatData || [];
        const newChatsList = chatsList.map(chat => {
          if (chat.messageId === chatItem.messageId) {
            chat.pinned = !chat.pinned;
          }
          return chat;
        });
        await updateDoc(chatRef, { chatData: newChatsList });
        toast.success(chatItem.pinned ? "Chat unpinned!" : "Chat pinned!");
      }
    } catch (error) {
      console.warn("Firestore error pinning, using local fallback:", error);
      // Local fallback
      setChatdata(prev => prev.map(chat => {
        if (chat.messageId === chatItem.messageId) {
          return { ...chat, pinned: !chat.pinned };
        }
        return chat;
      }));
      toast.success(chatItem.pinned ? "Simulated chat unpinned!" : "Simulated chat pinned!");
    }
  };

  // 👤❌ Unfriend User
  const unfriendUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to unfriend ${targetUser.name || targetUser.username}?`)) {
      return;
    }
    
    try {
      const chatsRef = collection(db, "chats");
      
      // 1. Remove chat from current user
      const selfSnap = await getDoc(doc(chatsRef, userData.id));
      if (selfSnap.exists()) {
        const selfChats = selfSnap.data().chatData || [];
        const updatedSelfChats = selfChats.filter(chat => chat.rId !== targetUser.id);
        await updateDoc(doc(chatsRef, userData.id), { chatData: updatedSelfChats });
      }

      // 2. Remove chat from target user
      const targetSnap = await getDoc(doc(chatsRef, targetUser.id));
      if (targetSnap.exists()) {
        const targetChats = targetSnap.data().chatData || [];
        const updatedTargetChats = targetChats.filter(chat => chat.rId !== userData.id);
        await updateDoc(doc(chatsRef, targetUser.id), { chatData: updatedTargetChats });
      }

      // 3. Clear active chat state if current active chat user is the one unfriended
      if (chatuser?.id === targetUser.id) {
        setChatuser(null);
        setMessagesId(null);
      }

      toast.success(`Unfriended ${targetUser.name || targetUser.username} successfully!`);
    } catch (error) {
      console.warn("Firestore error unfriending, using local fallback:", error);
      // Local fallback
      setChatdata(prev => prev.filter(chat => chat.rId !== targetUser.id));
      if (chatuser?.id === targetUser.id) {
        setChatuser(null);
        setMessagesId(null);
      }
      toast.success(`Simulated unfriending of ${targetUser.name}!`);
    }
  };

  // ✉️ Reset Unread Notification Count
  const resetUnreadCount = async (messageId) => {
    try {
      const chatRef = doc(db, "chats", userData.id);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatsList = chatSnap.data().chatData || [];
        let updated = false;
        const newChatsList = chatsList.map(chat => {
          if (chat.messageId === messageId && (chat.unreadCount > 0 || !chat.messageSeen)) {
            chat.unreadCount = 0;
            chat.messageSeen = true;
            updated = true;
          }
          return chat;
        });
        if (updated) {
          await updateDoc(chatRef, { chatData: newChatsList });
        }
      }
    } catch (error) {
      console.warn("Firestore error resetting unread count, using local fallback:", error);
      // Local fallback
      setChatdata(prev => prev.map(chat => {
        if (chat.messageId === messageId) {
          return { ...chat, unreadCount: 0, messageSeen: true };
        }
        return chat;
      }));
    }
  };

  // Filter lists based on Search Query
  const filteredChats = chatData.filter((chat) => {
    const name = chat.userData?.name || chat.userData?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort chat list: pinned chats first, then sort by updatedAt timestamp descending
  const sortedChats = [...filteredChats].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned; // Pinned items first
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0); // Then sort by timestamp
  });

  const filteredDiscover = allUsers.filter((user) => {
    const name = user.name || user.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const requestsList = friendRequests?.receivedRequests || [];

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <div className="profile-container-left">
            <img 
              src={userData?.avatar || assets.profile_img} 
              className="self-avatar" 
              alt="My Profile" 
              onClick={() => navigate("/profile")}
              title="Edit Profile"
            />
          </div>
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit Profile</p>
              <hr />
              <p onClick={() => auth.signOut()}>Logout</p>
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="ls-tabs">
          <button 
            className={activeTab === "chats" ? "active" : ""} 
            onClick={() => setActiveTab("chats")}
          >
            Chats
          </button>
          <button 
            className={activeTab === "discover" ? "active" : ""} 
            onClick={() => setActiveTab("discover")}
          >
            Discover
          </button>
          <button 
            className={activeTab === "requests" ? "active" : ""} 
            onClick={() => setActiveTab("requests")}
          >
            Requests
            {requestsList.length > 0 && (
              <span className="req-badge">{requestsList.length}</span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input 
            type="text" 
            placeholder={activeTab === "chats" ? "Search active chats..." : "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ls-list">
        {/* Render Tab 1: Chats */}
        {activeTab === "chats" && (
          sortedChats.length === 0 ? (
            <p className="empty-message">No active chats. Go to Discover to add friends!</p>
          ) : (
            sortedChats.map((chat) => (
              <div 
                key={chat.messageId} 
                className={`friend ${chatuser?.id === chat.userData?.id ? "active-friend" : ""}`} 
                onClick={() => {
                  setChatuser(chat.userData);
                  setMessagesId(chat.messageId);
                  resetUnreadCount(chat.messageId);
                }}
              >
                <div className="friend-info">
                  <img src={chat.userData?.avatar || assets.profile_img} alt="" />
                  <div>
                    <p>
                      {chat.userData?.name || chat.userData?.username}
                      {chat.pinned && <BsPinAngleFill className="pinned-icon" />}
                    </p>
                    <span>{chat.lastMessage || "No messages yet"}</span>
                  </div>
                </div>

                <div className="friend-meta">
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                  
                  <div className="more-menu-container">
                    <button 
                      className="more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === chat.messageId ? null : chat.messageId);
                      }}
                    >
                      <BsThreeDotsVertical />
                    </button>

                    {activeDropdownId === chat.messageId && (
                      <div className="friend-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="dropdown-item" 
                          onClick={() => {
                            togglePinChat(chat);
                            setActiveDropdownId(null);
                          }}
                        >
                          {chat.pinned ? (
                            <BsPinAngleFill className="item-icon pin-icon-active" />
                          ) : (
                            <BsPinAngle className="item-icon" />
                          )}
                          <span>{chat.pinned ? "Unpin Chat" : "Pin Chat"}</span>
                        </div>
                        <hr className="dropdown-divider" />
                        <div 
                          className="dropdown-item delete-item" 
                          onClick={() => {
                            unfriendUser(chat.userData);
                            setActiveDropdownId(null);
                          }}
                        >
                          <FiUserX className="item-icon" />
                          <span>Unfriend</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Render Tab 2: Discover */}
        {activeTab === "discover" && (
          loadingUsers ? (
            <p className="empty-message">Loading users...</p>
          ) : filteredDiscover.length === 0 ? (
            <p className="empty-message">No other users found.</p>
          ) : (
            filteredDiscover.map((user) => {
              const isFriend = chatData.some((chat) => chat.rId === user.id);
              const isSent = friendRequests?.sentRequests?.some((r) => r.toId === user.id);
              const isReceived = requestsList.some((r) => r.fromId === user.id);

              return (
                <div key={user.id} className="discover-user">
                  <div className="discover-info">
                    <img src={user.avatar || assets.profile_img} alt="" />
                    <div>
                      <p>{user.name || user.username}</p>
                      <span>{user.bio || "No bio available"}</span>
                    </div>
                  </div>
                  
                  <div className="discover-actions">
                    {isFriend ? (
                      <button 
                        className="action-btn chat-btn" 
                        onClick={() => {
                          const chat = chatData.find((c) => c.rId === user.id);
                          if (chat) {
                            setChatuser(user);
                            setMessagesId(chat.messageId);
                            setActiveTab("chats");
                            resetUnreadCount(chat.messageId);
                          }
                        }}
                      >
                        Chat
                      </button>
                    ) : isSent ? (
                      <button className="action-btn sent-btn" disabled>Sent</button>
                    ) : isReceived ? (
                      <button 
                        className="action-btn accept-btn" 
                        onClick={() => acceptFriendRequest(requestsList.find(r => r.fromId === user.id))}
                      >
                        Accept
                      </button>
                    ) : (
                      <button 
                        className="action-btn add-btn" 
                        onClick={() => sendFriendRequest(user)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Render Tab 3: Requests */}
        {activeTab === "requests" && (
          requestsList.length === 0 ? (
            <p className="empty-message">No pending friend requests.</p>
          ) : (
            requestsList.map((req) => (
              <div key={req.fromId} className="discover-user">
                <div className="discover-info">
                  <img src={req.fromAvatar || assets.profile_img} alt="" />
                  <div>
                    <p>{req.fromName}</p>
                    <span>{req.fromBio || "Wants to connect!"}</span>
                  </div>
                </div>
                <div className="discover-actions">
                  <button 
                    className="action-btn accept-btn" 
                    onClick={() => acceptFriendRequest(req)}
                  >
                    Accept
                  </button>
                  <button 
                    className="action-btn decline-btn" 
                    onClick={() => declineFriendRequest(req)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
