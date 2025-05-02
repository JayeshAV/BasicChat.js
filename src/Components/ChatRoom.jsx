import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { FaSignOutAlt, FaTrashAlt } from 'react-icons/fa';  // To use for logout and delete icons
import { redirect, useNavigate } from "react-router-dom";

const ChatRoom = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Send a message to the Firestore database
  const sendMessage = async (e) => {
    e.preventDefault();

    if (message.trim() === "") return;

    await addDoc(collection(db, "messages"), {
      text: message,
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.email,
      isDeleted: false, 
      logout:false
    });

    setMessage("");
  };

  console.log(auth)

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const msgData = doc.data();
        if (!msgData.isDeleted) {  
          msgs.push({ id: doc.id, ...msgData });
        }
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const deleteMessage = async (id) => {
    const msgRef = doc(db, "messages", id);
    await deleteDoc(msgRef); 
  };

  const navigate=useNavigate()

  const handleLogout = () => {
    auth.signOut()
    navigate("/")
    
  };
  console.log(messages)

  return (

<div className="h-screen flex flex-col bg-[#131c2e] text-white">
  <div className="bg-[#1a2436] p-4 shadow-md flex items-center justify-between relative">
    <h2 className="text-xl font-bold">Group Chat 💬</h2>
    <button
      onClick={handleLogout}
      className="bg-red-600 p-2 rounded-full text-white hover:bg-red-700 flex items-center justify-center"
    >
      <FaSignOutAlt />
    </button>
  </div>

  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={`flex items-start ${msg.uid === auth.currentUser.uid ? 'justify-end' : 'justify-start'}`}
      >
        {msg.uid !== auth.currentUser.uid && (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold mr-2">
            {(msg.displayName?.charAt(0) || "U").toUpperCase()}
          </div>
        )}
        
        <div 
          className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${
            msg.uid === auth.currentUser.uid 
              ? 'bg-[#2962ff] rounded-tl-lg rounded-bl-lg rounded-tr-lg' 
              : 'bg-[#1a2436] rounded-tr-lg rounded-br-lg rounded-bl-lg'
          }`}
        >
          <div className="flex justify-between">
            <div className="break-words pr-2">{msg.text}</div>
            {msg.uid === auth.currentUser.uid && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="text-gray-300 hover:text-red-300 text-xs flex-shrink-0 mt-1 flex items-center gap-1 ml-2"
              >
                <FaTrashAlt /> 
              </button>
            )}
          </div>

          <div className="flex justify-between text-xs text-gray-300 pt-1">
            <span className="pe-1 text-[11px]">{msg.displayName || "User"}</span>
            <span className="pe-1 text-[11px]">{new Date(msg.createdAt?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
        
        {msg.uid === auth.currentUser.uid && (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold ml-2">
            {(msg.displayName?.charAt(0) || "U").toUpperCase()}
          </div>
        )}
      </div>
    ))}
  </div>

  <div className="p-4 bg-[#1a2436] border-t border-gray-700">
    <form onSubmit={sendMessage} className="flex items-center gap-2">
      <input
        className="flex-1 p-3 rounded-full bg-[#131c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button
        type="button"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        className="p-3 rounded-full bg-[#131c2e] hover:bg-gray-600 text-white"
      >
        😊
      </button>
      <button 
        type="submit" 
        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </form>
  </div>

  {showEmojiPicker && (
    <div className="absolute bottom-20 right-16 bg-[#1a2436] p-3 rounded-lg shadow-lg border border-gray-700 grid grid-cols-6 gap-2">
      {["😊", "😂", "❤️", "👍", "🎉", "🔥", "😎", "🤔", "👀", "✨", "🙌", "👋"].map(emoji => (
        <span 
          key={emoji}
          onClick={() => setMessage((prev) => prev + emoji)} 
          className="text-xl hover:bg-[#131c2e] p-1 rounded cursor-pointer"
        >
          {emoji}
        </span>
      ))}
    </div>
  )}
</div>
  );
};

export default ChatRoom;
