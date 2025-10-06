import React, { useContext, useEffect, useState } from 'react'
import "./Chat.css";
import LeftSidebar from '../../Components/LeftSidebar/LeftSidebar';
import ChatBox from '../../Components/ChatBox/ChatBox';
import RightSidebar from '../../Components/RightSidebar/RightSidebar';
import { AppContext } from '../../context/AppContext';


const Chat = () => {
  const {chatData,userData} = useContext(AppContext);
  const [loading,setLording] = useState(true);

  useEffect(()=>{
    if(chatData && userData){
      setLording(false)
    }

  },[chatData,userData])

  return (
    <div className='chat'> 
    {loading 
    ? <p className='lording'>Lording..</p>
    : <div className="chat-container">
        <LeftSidebar/>
        <ChatBox/>
        <RightSidebar/>
      </div>
    }
    </div>
  )
}

export default Chat