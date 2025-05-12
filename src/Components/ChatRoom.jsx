import React, { useEffect, useRef, useState } from "react";
import { db, auth } from "../firebase.js";
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
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { FaSignOutAlt, FaTrashAlt, FaArrowLeft, FaSearch, FaClock, FaUsers, FaImage } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';


registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

const ChatRoom = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [viewMode, setViewMode] = useState("recent");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const privateChatCollectionName = "privateChats";
  const [imageFiles, setImageFiles] = useState([]);
  const imageInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [shouldSendImages, setShouldSendImages] = useState(false);


  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );
    setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleCancel = (indexToRemove) => {
    setImageFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      console.log("Updated imageFiles after cancel:", updatedFiles); 
      return updatedFiles;
    });
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };



  const sendMessage = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      console.error("User not authenticated.");
      alert("Please log in to send a message.");
      return;
    }
    if (message.trim() === "" && imageFiles.length === 0) return;
    if (!selectedUser) {
      alert("Please select a user to chat with first");
      return
    }

    console.log("imageFiles before send:", imageFiles); 
  setShouldSendImages(true); 

    try {
      const currentUserData = users.find(
        (user) => user.email === auth.currentUser?.email
      );

      const displayName =
        currentUserData?.displayName ||
        auth.currentUser?.displayName ||
        auth.currentUser?.email?.split("@")[0] ||
        "Unknown User";

      const senderId = auth.currentUser.uid;
      const recipientUid = selectedUser.uid;

      if (!senderId) {
        console.error("Current user has no valid UID");
        alert(
          "Error: Your user account is missing an ID. Please try logging out and back in."
        );
        return;
      }

      if (!recipientUid) {
        console.error("Selected recipient has no valid UID:", selectedUser);
        alert(
          "Error: Selected recipient has no valid ID. Please try selecting another user."
        );
        return;
      }

      const participants = [senderId, recipientUid];
      const chatId = participants.sort().join("_");
      const localTimeStamp = getFormattedTime();
      const base64Images = [];

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            const base64 = await convertToBase64(file);
            base64Images.push(base64);
          } catch (error) {
            console.error("Error converting image to base64:", error);
            console.log("Failed to process image: " + error.message);
            return; 
          }
        }
      }

      const messageData = {
        text: message,
        createdAt: serverTimestamp(),
        localTimeStamp: localTimeStamp,
        uid: senderId,
        email: auth.currentUser.email,
        displayName: displayName,
        isDeleted: false,
        recipientUid: recipientUid,
        recipientEmail: selectedUser.email,
        participants: participants,
        chatId: chatId,
        images: base64Images,
      };

      await addDoc(
        collection(db, privateChatCollectionName),
        messageData
      );

      setMessage("");
      setImageFiles([]); 
      setShowEmojiPicker(false)
      setShouldSendImages(false); 
      console.log("imageFiles after send:", []); 
      updateRecentContacts(
        recipientUid,
        message || (base64Images.length > 0 ? "Sent images" : ""),
        localTimeStamp
      );
    } catch (error) {
      console.error("Error sending message:", error); 
      alert("Failed to send message: " + error.message);
    }
  };


  const updateRecentContacts = (recipientUid, lastMessage, lastMessageTime) => {
    setRecentContacts((prevContacts) => {
      const existingContactIndex = prevContacts.findIndex(
        (contact) => contact.uid === recipientUid
      );

      let updatedContacts = [...prevContacts];

      if (existingContactIndex > -1) {
        const existingContact = updatedContacts[existingContactIndex];
        updatedContacts.splice(existingContactIndex, 1);
        updatedContacts.unshift({
          ...existingContact,
          lastMessage,
          lastMessageTime,
        });
      } else {
        const recipientUser = users.find((user) => user.uid === recipientUid);
        if (recipientUser) {
          updatedContacts.unshift({
            uid: recipientUser.uid,
            displayName: recipientUser.displayName,
            email: recipientUser.email,
            lastMessage: lastMessage,
            lastMessageTime: lastMessageTime,
          });
        }
      }

      return [...updatedContacts].sort((a, b) =>
        b.lastMessageTime.localeCompare(a.lastMessageTime)
      );
    });
  };


  const updateRecentContactsOnNewMessage = (
    recipientUid,
    displayName,
    email,
    lastMessage,
    lastMessageTime
  ) => {
    setRecentContacts((prevContacts) => {
      const existingContactIndex = prevContacts.findIndex(
        (contact) => contact.uid === recipientUid
      );

      let updatedContacts = [...prevContacts];

      if (existingContactIndex > -1) {
        const existingContact = updatedContacts[existingContactIndex];
        updatedContacts.splice(existingContactIndex, 1);
        updatedContacts.unshift({
          ...existingContact,
          lastMessage,
          lastMessageTime,
        });

      } else {

        updatedContacts.unshift({
          uid: recipientUid,
          displayName: displayName,
          email: email,
          lastMessage: lastMessage,
          lastMessageTime: lastMessageTime,
        });

      }

      return [...updatedContacts].sort((a, b) =>
        b.lastMessageTime.localeCompare(a.lastMessageTime)
      );
    });
  };

  useEffect(() => {
    if (!auth.currentUser || !selectedUser || !selectedUser.uid) return;

    const currentUserId = auth.currentUser.uid;
    const otherUserId = selectedUser.uid;
    const chatId = [currentUserId, otherUserId].sort().join("_");

    const messagesQuery = query(
      collection(db, privateChatCollectionName),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          console.log("No messages found for this chat.");
        }
        const fetchedMessages = [];
        snapshot.forEach((doc) => {
          fetchedMessages.push({ ...doc.data(), id: doc.id });
        });
        setMessages(fetchedMessages);
      },
      (error) => {
        console.error("Error fetching messages: ", error);
      }
    );
    return () => unsubscribe();
  }, [auth, selectedUser]);


  useEffect(() => {
    if (!auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    const chatIds = new Set();
    const unsubscribe = onSnapshot(
      collection(db, privateChatCollectionName),
      async (snapshot) => {
        try {
          snapshot.forEach((doc) => {
            const chatData = doc.data();
            if (chatData.participants.includes(currentUserId)) {
              chatIds.add(chatData.chatId);
            }
          });

          const uniqueContacts = new Map();

          for (const chatId of chatIds) {
            const chatMessagesQuery = query(
              collection(db, privateChatCollectionName),
              where("chatId", "==", chatId),
              orderBy("createdAt", "desc"), // Latest first
              // limit(1), // Get only the latest message
            );

            const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
            if (!chatMessagesSnapshot.empty) {
              const lastMessageDoc = chatMessagesSnapshot.docs[0];
              const lastMessageData = lastMessageDoc.data();
              const otherUserId = lastMessageData.participants.find(
                (uid) => uid !== currentUserId
              );
              let lastMessageText = lastMessageData.text;
              if (lastMessageData.images && lastMessageData.images.length > 0) {
                lastMessageText = "Sent Images";
              }

              if (otherUserId) {
                const otherUser = users.find((u) => u.uid === otherUserId);
                if (otherUser) {
                  const contactKey = otherUser.uid;
                  uniqueContacts.set(contactKey, {
                    uid: otherUser.uid,
                    displayName: otherUser.displayName,
                    email: otherUser.email,
                    lastMessage: lastMessageText,
                    lastMessageTime: lastMessageData.localTimeStamp,
                  });
                }
              }
            }
          }
          setRecentContacts(
            Array.from(uniqueContacts.values()).sort((a, b) =>
              b.lastMessageTime.localeCompare(a.lastMessageTime)
            )
          );
        } catch (error) {
          console.error("Error fetching recent contacts:", error);
        }
      }
    );
    return () => unsubscribe();
  }, [auth.currentUser, users]);

  
  useEffect(() => {
    if (!auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;

    const unsubscribe = onSnapshot(
      collection(db, privateChatCollectionName),
      (snapshot) => {
        console.log(snapshot)

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {

            const newMessage = change.doc.data();

            if (newMessage.participants.includes(currentUserId)) {

              const otherUserId = newMessage.participants.find(
                (uid) => uid !== currentUserId

              );

              let lastMessageText = newMessage.text;

              if (newMessage.images && newMessage.images.length > 0) {
                lastMessageText = "Sent Images";
              }

              const otherUser = users.find((user) => user.uid === otherUserId);
              if (otherUser) {
                updateRecentContactsOnNewMessage(
                  otherUser.uid,    
                  otherUser.displayName,
                  otherUser.email,
                  lastMessageText,
                  newMessage.localTimeStamp
                );
              }
            }
          }
        });
      },
      (error) => {
        console.error("Error listening for new messages:", error);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser, users]);


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, "users"));
        const userList = [];
        userSnapshot.forEach((doc) => {
          const userData = doc.data();
          userList.push({
            id: doc.id,
            uid: userData.uid,
            ...userData,
          });
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
      const chatRef = doc(db, 'privateChats', id);
      const docSnapshot = await getDoc(chatRef);

      if (!docSnapshot.exists()) {
        console.log("Document not found!");
        return;
      }

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this message?"
      );

      if (confirmDelete) {
        await updateDoc(chatRef, {
          isDeleted: true,
          text: "This message was deleted.", 
          images: [], 
        });
        console.log("Chat marked as deleted!");
      }
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


  const handleUserSelect = (user) => {
    if (user.uid === auth.currentUser?.uid) {
      return;
    }

    const selectedUserWithUid = {
      ...user,
      uid: user.uid,
    };

    setSelectedUser(selectedUserWithUid);
    setSearchQuery("");
    setShowSearchInput(false);
  };


  const currentUserDetails = users.find(
    (user) => user.email === auth?.currentUser?.email
  );


  const getSenderDisplayName = (msg) => {
    const msgUser = users.find(
      (user) => user.uid === msg.uid || user.email === msg.email
    );
    if (msgUser?.displayName) {
      return msgUser.displayName;
    }
    return msg.displayName || msg.email?.split("@")[0] || "Unknown User";
  };


  const getSenderInitial = (msg) => {
    if (msg.uid !== auth.currentUser?.uid) {
      const msgUser = users.find(
        (user) => user.uid === msg.uid || user.email === msg.email
      );
      if (msgUser?.displayName) {
        return (msgUser.displayName.charAt(0) || "U").toUpperCase();
      }
      return (msg.displayName?.charAt(0) || "U").toUpperCase();
    }
    const currentName =
      currentUserDetails?.displayName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split("@")[0] ||
      "U";
    return currentName.charAt(0).toUpperCase();
  };


  const handleSearchBtn = () => {
    setShowSearchInput(!showSearchInput);
  };


  const handleClose = () => {
    setSearchQuery("");
    setShowSearchInput(false);
  };


  const filterUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.split("@")[0].toLowerCase().includes(searchQuery.toLowerCase())
  );


  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };


  
  return (
    <>
      <div className="flex h-screen">
        <div className="w-full md:w-80 bg-[#1A2436] border-r border-gray-700 overflow-y-auto   xl:block">
          <div className="bg-[#1a2436] p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-xl text-white font-bold">Chat</h2>
            <div className="flex gap-2">
              <button
                className={`p-2 rounded-lg ${
                  viewMode === "recent" ? "bg-blue-600" : "bg-gray-700"
                }`}
                onClick={() => toggleViewMode("recent")}
                title="Recent Chats"
              >
                <FaClock className="text-white" />
              </button>
              <button
                className={`p-2 rounded-lg ${
                  viewMode === "all" ? "bg-blue-600" : "bg-gray-700"
                }`}
                onClick={() => toggleViewMode("all")}
                title="All Users"
              >
                <FaUsers className="text-white" />
              </button>
              <button
                className="bg-blue-500 text-white p-2 rounded-lg"
                onClick={handleSearchBtn}
              >
                <FaSearch />
              </button>
            </div>
          </div>

          {showSearchInput && (
            <div className="p-4">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search Users..."
                  className="w-full p-2 bg-gray-700 text-white rounded-lg outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleClose} className="ms-2">
                  <i className="fa-solid fa-xmark text-gray-200 text-xl"></i>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            {searchQuery &&
              filterUsers
                .filter((user) => user.uid !== auth.currentUser?.uid)
                .map((user) => (
                  <div
                    key={user.uid}
                    className={`mb-2 cursor-pointer ${
                      selectedUser?.uid === user.uid
                        ? "border-l-4 border-blue-500 bg-gray-700"
                        : ""
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <h1 className="text-white text-xl bg-gray-700 py-2 rounded-xl m-1 ps-2 flex items-center">
                      <span className="p-2 rounded-full px-4 bg-blue-500 me-4">
                        {(
                          user.displayName?.charAt(0) ||
                          user.email?.charAt(0) ||
                          "U"
                        ).toUpperCase()}
                      </span>
                      {user.displayName ||
                        user.email?.split("@")[0] ||
                        "Unknown User"}
                    </h1>
                  </div>
                ))}

            {!searchQuery && viewMode === "recent" && (
              <>
                <h3 className="text-gray-400 text-sm font-medium px-4 py-2">
                  RECENT CHATS
                </h3>
                {recentContacts.length > 0 ? (
                  recentContacts.map((contact) => (
                    <div
                      key={contact.uid}
                      className={`mb-2 cursor-pointer ${
                        selectedUser?.uid === contact.uid
                          ? "border-l-4 border-blue-500 bg-gray-700"
                          : ""
                      }`}
                      onClick={() => handleUserSelect(contact)}
                    >
                      <div className="text-white bg-gray-700 hover:bg-gray-600 py-2 rounded-xl m-1 ps-2 flex items-center">
                        <span className="p-2 rounded-full px-4 bg-blue-500 me-4">
                          {(contact.displayName?.charAt(0) || "U").toUpperCase()}
                        </span>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-medium">{contact.displayName}</h3>
                          <p className="text-gray-400 text-sm truncate">
                            {contact.lastMessage || "Start a conversation"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    No recent conversations found
                  </div>
                )}
              </>
            )}

            {!searchQuery && viewMode === "all" && (
              <>
                <h3 className="text-gray-400 text-sm font-medium px-4 py-2">
                  ALL USERS
                </h3>
                {users.filter((user) => user.uid !== auth.currentUser?.uid)
                  .length > 0 ? (
                  users
                    .filter((user) => user.uid !== auth.currentUser?.uid)
                    .map((user) => (
                      <div
                        key={user.uid}
                        className={`mb-2 cursor-pointer ${
                          selectedUser?.uid === user.uid
                            ? "border-l-4 border-blue-500 bg-gray-700"
                            : ""
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <h1 className="text-white text-xl bg-gray-700 hover:bg-gray-600 py-2 rounded-xl m-1 ps-2 flex items-center">
                          <span className="p-2 rounded-full px-4 bg-blue-500 me-4">
                            {(
                              user.displayName?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </span>
                          {user.displayName ||
                            user.email?.split("@")[0] ||
                            "Unknown User"}
                        </h1>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    No other users found
                  </div>
                )}
              </>
            )}

            {!searchQuery && viewMode !== "recent" && viewMode !== "all" && (
              <div className="text-center text-gray-400 p-4">
                Select view mode to see users
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#131c2e] text-white">
          <div className="bg-[#1a2436] p-5 shadow-md flex items-center justify-between">
            <h2 className="text-xl font-bold flex-1">
              {selectedUser ? (
                <div className="flex items-center">
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                    {(
                      selectedUser.displayName?.charAt(0) ||
                      selectedUser.email?.charAt(0) ||
                      "U"
                    ).toUpperCase()}
                  </span>
                  <span>
                    {selectedUser.displayName ||
                      selectedUser.email?.split("@")[0] ||
                      "Unknown User"}
                  </span>
                </div>
              ) : (
                <>
                  Select a user to start chatting{" "}
                  {currentUserDetails
                    ? `(Logged in as: ${
                        currentUserDetails.displayName ||
                        auth.currentUser?.displayName ||
                        "Unknown"
                      })`
                    : ""}
                </>
              )}
            </h2>
            <div className="flex">
              <h1 className="pe-3">{currentUserDetails?.displayName}</h1>
              <button
                onClick={handleLogout}
                className="rounded-full text-white hover:text-red-400"
              >
                <FaSignOutAlt className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f172a] text-white pt-10">
          {messages.length === 0 ? (
              <div className="mb-20 flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-inner opacity-100 bg-gradient-to-br from-blue-100 to-blue-600 shadow-md">
                  <p className="text-white text-6xl font-semibold">
                    {selectedUser?.displayName?.[0]?.toUpperCase() || "?"}
                  </p>
                </div>
                <p className="mt-3 text-center text-xl font-semibold text-gray-300 tracking-wide">
                  {selectedUser?.displayName?.toUpperCase() || "SELECT A USER"}
                </p>
                <p className="text-gray-600 pt-3">
                  {selectedUser
                    ? `No messages yet. Say hello to ${
                        selectedUser?.displayName
                      }!`
                    : "Select a user to begin chatting"}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const senderName = getSenderDisplayName(msg);
                const initial = senderName?.charAt(0).toUpperCase();
                const isCurrentUser = msg.uid === auth.currentUser?.uid;
                const currentDocId = msg?.id;
                const messageTime = msg.localTimeStamp;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 mb-3 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isCurrentUser && (
                      <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center">
                        {initial}
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-lg max-w-[70%] ${
                        isCurrentUser
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      <div className="text-sm flex flex-col">
                        {msg.isDeleted ? (
                          <em className="text-gray-400 italic">
                            This message was deleted.
                          </em>
                        ) : (
                          <>
                            {msg.text && <span>{msg.text}</span>}
                            {msg.images &&
                              msg.images.map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`Image ${index + 1}`}
                                  className="mt-2 rounded-md max-h-60 mb-2" 
                                />
                              ))}
                          </>
                        )}
                        {isCurrentUser && !msg.isDeleted && (
                          <button
                            onClick={() => deleteMessage(currentDocId)}
                            className="ml-2 text-sm text-red-300 hover:text-red-500 self-end"
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 mt-1 block">
                        {senderName}
                      </span>
                      <span className="text-xs text-gray-400">{messageTime}</span>
                    </div>

                    {isCurrentUser && (
                      <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center">
                        {initial}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[#1a2436] border-t border-gray-700 relative">
            
      <form
        onSubmit={sendMessage}
        className="flex flex-wrap md:flex-nowrap items-center gap-2"
      >
        <input
          className="flex-1 p-3 rounded-full bg-[#131c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            selectedUser
              ? `Message ${
                  selectedUser.displayName || selectedUser.email?.split("@")[0]
                }...`
              : "Select a user to start chatting..."
          }
          disabled={!selectedUser}
        />

        
        {imageFiles.length > 0 && (
          <div className="image-preview flex flex-wrap gap-2">
            {imageFiles.map((file, index) => (
  <div key={index} className="relative">
    <img
      src={URL.createObjectURL(file)}
      alt={`Preview ${index}`}
      className="w-24 h-24 object-cover rounded-md"
    />
   
    <button
      onClick={() => handleCancel(index)}
      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
    >
      &times;
    </button>
  </div>
))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => imageInputRef.current.click()}
            className="p-3 rounded-full bg-[#131c2e] hover:bg-gray-600 text-white"
            disabled={!selectedUser}
          >
            <FaImage />
          </button>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={imageInputRef}
          />
        </div>

     
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-3 rounded-full bg-[#131c2e] hover:bg-gray-600 text-white"
          disabled={!selectedUser}
        >
          😊
        </button>

      
        <button
          type="submit"
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          disabled={
            !selectedUser ||
            (message.trim() === "" && imageFiles.length === 0)
          }
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
      </form>


      {showEmojiPicker && (
        <div className="absolute bottom-10 right-10 z-50 scale-90 origin-top-right">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            emojiStyle="native"
          />
        </div>
      )}
    </div>
        </div>
      </div>
    </>
  );
};

export default ChatRoom;

