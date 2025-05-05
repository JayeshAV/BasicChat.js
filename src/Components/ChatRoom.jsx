import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { FaSignOutAlt, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Picker } from 'emoji-mart';
// import 'emoji-mart/css/emoji-mart.css';

const ChatRoom = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [users, setUsers] = useState([]);


  const navigate = useNavigate();

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    try {
     
      const currentUserData = users.find(user => user.email === auth.currentUser?.email);
      
      await addDoc(collection(db, "messages"), {
        text: message,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: currentUserData?.displayName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Unknown User",
        isDeleted: false,
        logout: false,
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };


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


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, "users"));
        const userList = [];
        userSnapshot.forEach((doc) => {
          userList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);


  const deleteMessage = async (id) => {
    try {
      const msgRef = doc(db, "messages", id);
      const matchdelete=confirm("are you confirm to delete this message ?")
      if(matchdelete) return await deleteDoc(msgRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      auth.signOut();
      navigate("/");
    }
  };

  const currentUserDetails = users.find(user => user.email === auth?.currentUser?.email);
  
  const getUserByUid = (uid) => {
    return users.find(user => user.uid === uid) || null;
  };

  const getSenderDisplayName = (msg) => {
    
    if (msg.uid === auth.currentUser?.uid) {
      return "You";
    }
    
 
    const msgUser = users.find(user => 
      user.uid === msg.uid || user.email === msg.email
    );
    
    if (msgUser?.displayName) {
      return msgUser.displayName;
    }
    
    return msg.displayName || (msg.email ? msg.email.split('@')[0] : "Unknown User");
  };

  const getSenderInitial = (msg) => {

    if (msg.uid !== auth.currentUser?.uid) {
   
      const msgUser = users.find(user => 
        user.uid === msg.uid || user.email === msg.email
      );
      
      if (msgUser?.displayName) {
        return (msgUser.displayName.charAt(0) || "U").toUpperCase();
      }
      
      return (msg.displayName?.charAt(0) || "U").toUpperCase();
    }
    
  
    const currentName = currentUserDetails?.displayName || 
                        auth.currentUser?.displayName || 
                        auth.currentUser?.email?.split('@')[0] ||
                        "U";
    
    return currentName.charAt(0).toUpperCase();
  };
  
  return (
    <>
<div className="flex h-screen">
  {/* User List (Sidebar) */}
  <div className="w-full md:w-64 bg-[#1A2436] border-r border-gray-700 overflow-y-auto sm:hidden hidden xl:block">
    <div className="bg-[#1a2436] p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
      <h2 className="text-xl text-white font-bold">Users</h2>
    </div>
    <div className="pt-2">
      {users.map((user) => (
        <div key={user.id} className="mb-2">
          <h1 className="text-white text-xl bg-gray-700 py-2 rounded-xl m-1 ps-2 flex items-center">
            <span className="p-2 rounded-full px-4 bg-blue-500 me-4">
              {(user.displayName?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
            </span>
            {user.displayName || user.email?.split('@')[0] || "Unknown User"}
          </h1>
        </div>
      ))}
    </div>
  </div>

  {/* Main Chat Area */}
  <div className="flex-1 flex flex-col bg-[#131c2e] text-white">
    {/* Chat Header */}
    <div className="bg-[#1a2436] p-4 shadow-md flex items-center justify-between">
      <h2 className="text-xl font-bold">
        Group Chat 💬{" "}
        {currentUserDetails
          ? `(Logged in as: ${currentUserDetails.displayName || auth.currentUser?.displayName || "Unknown"})`
          : ""}
      </h2>
      <button onClick={handleLogout} className="rounded-full text-white hover:text-red-400">
        <FaSignOutAlt className="h-5 w-5" />
      </button>
    </div>

    {/* Message Display Area */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start ${
            msg.uid === auth.currentUser?.uid ? "justify-end" : "justify-start"
          }`}
        >
          {msg.uid !== auth.currentUser?.uid && (
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
              {getSenderInitial(msg)}
            </div>
          )}

          <div
            className={`max-w-[80%] sm:max-w-[70%] md:max-w-md p-3 rounded-lg shadow-md ${
              msg.uid === auth.currentUser?.uid
                ? "bg-[#2962ff] rounded-tl-lg rounded-bl-lg rounded-tr-lg"
                : "bg-[#1a2436] rounded-tr-lg rounded-br-lg rounded-bl-lg"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="break-words pr-2">{msg.text}</div>
              {msg.uid === auth.currentUser?.uid && (
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="text-gray-300 hover:text-red-300 text-xs p-0 min-h-0 h-auto"
                >
                  <FaTrashAlt className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-300 pt-1">
              <span className="pe-1 text-[11px] font-bold">
                {getSenderDisplayName(msg)}
              </span>
              <span className="pe-1 text-[11px]">
                {msg.createdAt?.seconds
                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          </div>

          {msg.uid === auth.currentUser?.uid && (
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold ml-2">
              {getSenderInitial(msg)}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Message Input Area */}
    <div className="p-4 bg-[#1a2436] border-t border-gray-700 relative">
      <form
        onSubmit={sendMessage}
        className="flex flex-wrap md:flex-nowrap items-center gap-2"
      >
        <input
          className="flex-1 p-3 rounded-full bg-[#131c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-3 rounded-full bg-[#131c2e] hover:bg-gray-600 text-white"
          >
            😊
          </button>
          <button
            type="submit"
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>

      {showEmojiPicker && (
        <motion.div
          ref={emojiPickerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 right-4 z-10"
        >
          <Picker onSelect={handleEmojiSelect} />
        </motion.div>
      )}
    </div>
  </div>
</div>

    </>
  );
};

export default ChatRoom;