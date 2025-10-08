// src/components/ChatBox.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../Config/firebase";

const ChatBox = () => {
  const { userData, messagesId, chatuser, messages, setMessages } = useContext(AppContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: userData?.id,
      content: input.trim(),
      type: "text",
      timestamp: new Date().toISOString(),
    };

    const msgRef = doc(db, "messages", messagesId);
    await updateDoc(msgRef, {
      messages: arrayUnion(newMessage),
    });

    setInput("");
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
        <input type="file" id="image" accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="Gallery" />
        </label>
        <img src={assets.send_button} alt="Send" onClick={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatBox;
