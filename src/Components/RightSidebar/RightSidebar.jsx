import React, { useContext } from "react";
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from "../../Config/firebase";
import { AppContext } from "../../context/AppContext";

const RightSidebar = () => {
  const { chatuser, userData, messages } = useContext(AppContext);

  // If a chat is active, display the friend's profile picture and details.
  // Otherwise, display the logged-in user's actual profile picture and details.
  const displayUser = chatuser || userData;

  // Helper to robustly detect image URLs (including Base64 and Supabase storage)
  const isImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    if (url.startsWith("data:image/")) return true;
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    const isImageExt = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    const isSupabaseStorage = url.includes("supabase.co/storage");
    return isImageExt || isSupabaseStorage;
  };

  // Filter out all shared/received images from active conversation robustly
  const imageMessages = chatuser 
    ? messages.filter((msg) => msg.type === "image" || isImageUrl(msg.content)) 
    : [];

  if (!displayUser) {
    return (
      <div className="rs">
        <p className="loading-text">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="rs">
      <div className="rs-profile">
        <img src={displayUser.avatar || assets.profile_img} alt="" />
        <h3>
          {displayUser.name || displayUser.username}
          <img src={assets.green_dot} className="dot" alt="" />
        </h3>
        <p>{displayUser.bio || "Hey there! I am using Chat App."}</p>
      </div>
      <hr />
      <div className="rs-media">
        <p>Media</p>
        <div>
          {chatuser ? (
            imageMessages.length > 0 ? (
              imageMessages.map((msg) => (
                <img 
                  key={msg.id} 
                  src={msg.content} 
                  alt="shared-media" 
                  onClick={() => window.open(msg.content, "_blank")}
                  title="Click to view full image"
                />
              ))
            ) : (
              <p className="no-media">No media shared yet</p>
            )
          ) : (
            <p className="no-media">Select a chat to view media</p>
          )}
        </div>
      </div>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

export default RightSidebar;
