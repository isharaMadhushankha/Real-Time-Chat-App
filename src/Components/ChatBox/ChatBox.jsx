// src/components/ChatBox.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../Config/firebase";
import { uploadChatImage } from "../../Config/supabase";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";

const ChatBox = () => {
  const { userData, messagesId, chatuser, messages, setMessages, setChatdata } = useContext(AppContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // WhatsApp-style Image Preview States
  const [imagePreview, setImagePreview] = useState(null);
  const [captionInput, setCaptionInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Auto-scroll to bottom on new messages (with a robust render delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Send text message
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageText = input.trim();
    const newMessage = {
      id: Date.now(),
      sender: userData?.id,
      content: messageText,
      type: "text",
      timestamp: new Date().toISOString(),
    };

    setInput(""); // Clear input instantly so user gets immediate visual feedback!

    try {
      // 1. Send the message into room collection
      const msgRef = doc(db, "messages", messagesId);
      await updateDoc(msgRef, {
        messages: arrayUnion(newMessage),
      });

      // 2. Update chats list for Sender
      const senderChatRef = doc(db, "chats", userData.id);
      const senderSnap = await getDoc(senderChatRef);
      if (senderSnap.exists()) {
        const chatList = senderSnap.data().chatData || [];
        const updatedList = chatList.map(chat => {
          if (chat.rId === chatuser.id) {
            return {
              ...chat,
              lastMessage: messageText,
              updatedAt: Date.now(),
              messageSeen: true,
              unreadCount: 0
            };
          }
          return chat;
        });
        await updateDoc(senderChatRef, { chatData: updatedList });
      }

      // 3. Update chats list for Receiver
      const receiverChatRef = doc(db, "chats", chatuser.id);
      const receiverSnap = await getDoc(receiverChatRef);
      if (receiverSnap.exists()) {
        const chatList = receiverSnap.data().chatData || [];
        const updatedList = chatList.map(chat => {
          if (chat.rId === userData.id) {
            return {
              ...chat,
              lastMessage: messageText,
              updatedAt: Date.now(),
              messageSeen: false,
              unreadCount: (chat.unreadCount || 0) + 1
            };
          }
          return chat;
        });
        await updateDoc(receiverChatRef, { chatData: updatedList });
      }

    } catch (error) {
      console.warn("Firestore error, falling back to local chat messages:", error);
      
      // Append locally
      setMessages((prev) => [...prev, newMessage]);

      setChatdata((prev) => prev.map(chat => {
        if (chat.rId === chatuser.id) {
          return {
            ...chat,
            lastMessage: messageText,
            updatedAt: Date.now()
          };
        }
        return chat;
      }));

      // Simulate mock reply
      setTimeout(() => {
        const replyMessage = {
          id: Date.now() + 1,
          sender: chatuser.id,
          content: `Hi! This is a mock response from ${chatuser.name}. Your message was received! (Note: to link real-time databases, check your Firestore Security Rules).`,
          type: "text",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMessage]);

        setChatdata((prev) => prev.map(chat => {
          if (chat.rId === chatuser.id) {
            return {
              ...chat,
              lastMessage: replyMessage.content,
              updatedAt: Date.now()
            };
          }
          return chat;
        }));
      }, 1000);
    }
  };

  // Stage selected image in WhatsApp-style preview overlay
  const handleSendImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(file);
      setCaptionInput(""); // Reset caption input for new file
    }
  };

  // Upload to Supabase and send the image message (+ optional caption)
  const handleConfirmSendImage = async () => {
    if (!imagePreview) return;

    setIsUploadingImage(true);

    try {
      // 1. Upload selected file to Supabase Storage
      const publicUrl = await uploadChatImage(imagePreview);

      const newImageMessage = {
        id: Date.now(),
        sender: userData?.id,
        content: publicUrl,
        type: "image",
        timestamp: new Date().toISOString(),
      };

      // 2. Send image message into Firestore room
      try {
        const msgRef = doc(db, "messages", messagesId);
        await updateDoc(msgRef, {
          messages: arrayUnion(newImageMessage),
        });
      } catch (err) {
        console.warn("Firestore error sending image, appending locally:", err);
        setMessages((prev) => [...prev, newImageMessage]);
      }

      // 3. Update chats list for Sender to "📷 Sent an image"
      try {
        const senderChatRef = doc(db, "chats", userData.id);
        const senderSnap = await getDoc(senderChatRef);
        if (senderSnap.exists()) {
          const chatList = senderSnap.data().chatData || [];
          const updatedList = chatList.map(chat => {
            if (chat.rId === chatuser.id) {
              return {
                ...chat,
                lastMessage: "📷 Sent an image",
                updatedAt: Date.now(),
                messageSeen: true,
                unreadCount: 0
              };
            }
            return chat;
          });
          await updateDoc(senderChatRef, { chatData: updatedList });
        }
      } catch (err) {
        setChatdata((prev) => prev.map(chat => {
          if (chat.rId === chatuser.id) {
            return {
              ...chat,
              lastMessage: "📷 Sent an image",
              updatedAt: Date.now()
            };
          }
          return chat;
        }));
      }

      // 4. Update chats list for Receiver
      try {
        const receiverChatRef = doc(db, "chats", chatuser.id);
        const receiverSnap = await getDoc(receiverChatRef);
        if (receiverSnap.exists()) {
          const chatList = receiverSnap.data().chatData || [];
          const updatedList = chatList.map(chat => {
            if (chat.rId === userData.id) {
              return {
                ...chat,
                lastMessage: "📷 Sent an image",
                updatedAt: Date.now(),
                messageSeen: false,
                unreadCount: (chat.unreadCount || 0) + 1
              };
            }
            return chat;
          });
          await updateDoc(receiverChatRef, { chatData: updatedList });
        }
      } catch (err) {
        // Mock fallback simulation message if receiver is offline
        setTimeout(() => {
          const replyMessage = {
            id: Date.now() + 10,
            sender: chatuser.id,
            content: "Wow, beautiful picture! Thanks for sharing! 📷🌟",
            type: "text",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, replyMessage]);
          
          setChatdata((prev) => prev.map(chat => {
            if (chat.rId === chatuser.id) {
              return {
                ...chat,
                lastMessage: replyMessage.content,
                updatedAt: Date.now()
              };
            }
            return chat;
          }));
        }, 1500);
      }

      // 5. Send Caption as sequential text message if provided!
      if (captionInput.trim()) {
        const captionText = captionInput.trim();
        const newCaptionMessage = {
          id: Date.now() + 5,
          sender: userData?.id,
          content: captionText,
          type: "text",
          timestamp: new Date().toISOString(),
        };

        try {
          const msgRef = doc(db, "messages", messagesId);
          await updateDoc(msgRef, {
            messages: arrayUnion(newCaptionMessage),
          });
        } catch (err) {
          setMessages((prev) => [...prev, newCaptionMessage]);
        }

        // Update last message text in sidebar to the caption content
        try {
          const senderChatRef = doc(db, "chats", userData.id);
          const senderSnap = await getDoc(senderChatRef);
          if (senderSnap.exists()) {
            const chatList = senderSnap.data().chatData || [];
            const updatedList = chatList.map(chat => {
              if (chat.rId === chatuser.id) {
                return {
                  ...chat,
                  lastMessage: captionText,
                  updatedAt: Date.now(),
                  messageSeen: true,
                  unreadCount: 0
                };
              }
              return chat;
            });
            await updateDoc(senderChatRef, { chatData: updatedList });
          }
        } catch (err) {
          setChatdata((prev) => prev.map(chat => {
            if (chat.rId === chatuser.id) {
              return {
                ...chat,
                lastMessage: captionText,
                updatedAt: Date.now()
              };
            }
            return chat;
          }));
        }
      }

      toast.success("Image sent successfully!");
      setImagePreview(null);
      setCaptionInput("");

    } catch (error) {
      console.error("Image send failed:", error);
      toast.error("Failed to upload or send image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!chatuser) {
    return (
      <div className="chat-welcome">
        <img src={assets.logo_icon} alt="Welcome" />
        <p>Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className="chat-box">
      {/* WhatsApp-Style Image Preview Modal Overlay */}
      {imagePreview && (
        <div className="image-preview-overlay">
          <div className="image-preview-container">
            <div className="preview-header">
              <h4>Send Image</h4>
              <button 
                className="close-preview-btn" 
                onClick={() => !isUploadingImage && setImagePreview(null)}
                disabled={isUploadingImage}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="preview-body">
              <img src={URL.createObjectURL(imagePreview)} alt="Preview attachment" />
            </div>

            <input
              type="text"
              className="preview-caption-input"
              placeholder="Add a caption..."
              value={captionInput}
              disabled={isUploadingImage}
              onChange={(e) => setCaptionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isUploadingImage && handleConfirmSendImage()}
            />

            <div className="preview-footer">
              {isUploadingImage ? (
                <div className="preview-uploading">
                  <div className="spinner"></div>
                  <span>Uploading to Supabase Storage...</span>
                </div>
              ) : (
                <>
                  <button className="preview-cancel-btn" onClick={() => setImagePreview(null)}>
                    Cancel
                  </button>
                  <button className="preview-send-btn" onClick={handleConfirmSendImage}>
                    <img src={assets.send_button} alt="Send" />
                    <span>Send</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat header */}
      <div className="chat-user">
        <img src={chatuser.avatar || assets.profile_img} alt="Avatar" />
        <p>
          {chatuser.name} <img className="dot" src={assets.green_dot} alt="online" />
        </p>
        <img src={assets.help_icon} alt="Help" />
      </div>

      {/* Chat messages */}
      <div className="chat-msg">
        {messages.map((msg) => {
          const isSender = msg.sender === userData?.id;
          const avatar = isSender
            ? userData?.avatar || assets.profile_img
            : chatuser?.avatar || assets.profile_img;

          return (
            <div key={msg.id} className={isSender ? "r-msg" : "s-msg"}>
              {msg.type === "text" ? (
                <p className="msg">{msg.content}</p>
              ) : (
                <img className="msg-img" src={msg.content} alt="media" />
              )}
              <div>
                <img src={avatar} alt="user" />
                <p>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Send a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <input 
          type="file" 
          id="image" 
          accept="image/png, image/jpeg" 
          hidden 
          onChange={handleSendImage}
        />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="Gallery" />
        </label>
        <img src={assets.send_button} alt="Send" onClick={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatBox;
