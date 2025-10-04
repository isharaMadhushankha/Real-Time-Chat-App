import React from 'react'
import "./Chat.css";
import LeftSidebar from '../../Components/LeftSidebar/LeftSidebar';
import ChatBox from '../../Components/ChatBox/ChatBox';
import RightSidebar from '../../Components/RightSidebar/RightSidebar';


const Chat = () => {
  return (
    <div className='chat'> 
      <div className="chat-container">
        <LeftSidebar/>
        <ChatBox/>
        <RightSidebar/>
      </div>
  
    </div>
  )
}

export default Chat