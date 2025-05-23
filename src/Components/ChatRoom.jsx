import React, { useContext, useEffect, useRef, useState } from "react";
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
import {
  FaSignOutAlt,
  FaTrashAlt,
  FaArrowLeft,
  FaSearch,
  FaClock,
  FaUsers,
  FaImage,
  FaSmile,
  FaBars,
  FaTimes,
  FaMicrophone,
} from "react-icons/fa";
import { MdDarkMode } from "react-icons/md";
import { CiLight } from "react-icons/ci";
import { BsCloudDownloadFill } from "react-icons/bs";
import { MdOutlineCancel } from "react-icons/md";
import { MdDone, MdOutlineDoneAll } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import { toast } from "react-toastify";
import { ThemeContext } from "./ThemeContext.jsx";
import { color } from "framer-motion";
// import GetAiResponse from "./GetAiResponse.js";

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
  const [viewMode, setViewMode] = useState("all");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const privateChatCollectionName = "privateChats";
  const [imageFiles, setImageFiles] = useState([]);
  const imageInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [shouldSendImages, setShouldSendImages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const emojiPickerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [recognization, setRecognization] = useState(null);
  const [selectedImages,setSelectedImages]=useState(null)
   
  const { theme, toggletheme } = useContext(ThemeContext);


  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
    // setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      handleScreenSizeChange();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScreenSizeChange = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  useEffect(()=>{
if(messages.length>0){
    setViewMode("recent")
  }
  },[message])

  useEffect(() => {
    if (window.innerWidth < 768 && selectedUser) {
      setSidebarOpen(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
  //       setShowEmojiPicker(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleImageChange = async (e) => {
    const newFiles = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if(newFiles.length>=10){
      return  toast.error("maximum 10 images allowed to send")
    }else{
      setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }

    

    // const compressBlobs = [];

    // for (const file of newFiles) {
    //   const compressBlob = await compressImage(file);
    //   compressBlobs.push(compressBlob);

    //   console.log("compress blob: ", compressBlob);
    //   console.log("compress blob size: ", compressBlobs);
    // }
  };

  const handleCancel = (indexToRemove) => {
    setImageFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter(
        (_, index) => index !== indexToRemove
      );
      return updatedFiles;
    });
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  // const convertToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = () => resolve(reader.result);
  //     reader.onerror = reject;
  //     reader.readAsDataURL(file);
  //   });
  // };

  const compressImage = (
    file,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7
  ) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress the image."));
            }
          },
          "image/jpeg", // You can change this to 'image/png' if needed
          quality
        );
      };

      img.onerror = reject;

      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
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
      return;
    }

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

      // const isChatbot =
      //     recipientUid === "ai_bot_uid" ||
      //     recipientUid === 'ai_bot_uid' ||  // Try single quotes
      //     recipientUid.includes("ai_bot_uid") || // Check if it's part of a string
      //     recipientUid.toString().trim() === "ai_bot_uid" || // Trim and convert to string
      //     selectedUser.email === "ai@bot.com"; // Fallback to email check

      // console.log("Is AI Bot (new check):", isChatbot);
      // console.log("Is chatbot?", isChatbot, "Recipient UID:", recipientUid);
      // console.log(recipientUid)

      let messageData;

      // if (isChatbot) {

      //     const chatbotResponse = await GetAiResponse([{ role: "user", content: message }]);
      //     console.log(message)

      //     messageData = {
      //         text: chatbotResponse,
      //         createdAt: serverTimestamp(),
      //         localTimeStamp: getFormattedTime(),
      //         uid: "chatbot",
      //         email: "chatbot@example.com",
      //         displayName: "Chatbot",
      //         isDeleted: false,
      //         recipientUid: "chatbot",
      //         recipientEmail: "chatbot@example.com",
      //         participants: [senderId, "chatbot"],
      //         chatId: "chatbot",
      //         images: null,
      //     };
      // }

      if (!senderId || !recipientUid) {
        console.error("Invalid sender or recipient UID");
        alert("Error: Invalid user data.");
        return;
      }

      const participants = [senderId, recipientUid];
      const chatId = participants.sort().join("_");
      const localTimeStamp = getFormattedTime();
      let base64 = null;
        
      if (imageFiles.length > 0) {


        for(const file of imageFiles){
        try {
          const compressBlob = await compressImage(file);
          console.log(file)
          
            const reader = new FileReader();

            await new Promise((resolve, reject) => {
             reader.onloadend = () => {
               resolve (reader.result)
             };
             reader.onerror = reject;
             reader.readAsDataURL(compressBlob);
           }).then(async(base64Data)=>{
            
            base64=base64Data

            await addDoc(collection(db,privateChatCollectionName),{
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
              images: base64Data,
              filename:file.name,
              size: compressBlob.size,
              type: compressBlob.type,
              chatMessageRef: privateChatCollectionName
            })
           
            console.log('Image uploaded and document created:', file.name);
           }).catch((Err)=>{
            console.log("error converting to base64:",Err)
           })
          
        } catch (error) {
          console.error("Error converting image to base64:", error);
          base64 = null;
        }

      }
      setImageFiles()
      }else{
        messageData = {
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
          chatId: chatId
        };
  
        await addDoc(collection(db, privateChatCollectionName), messageData);
      }
    

      setMessage("");
      setImageFiles([]);
      setShowEmojiPicker(false);
      setShouldSendImages(false);
      updateRecentContacts(recipientUid, message, getFormattedTime());
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + error.message);
    }
  };

  // updated contacts sender side
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

  // recever and sender side message
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
              orderBy("createdAt", "desc")
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

  //fetch users
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
      const chatRef = doc(db, "privateChats", id);
      const docSnapshot = await getDoc(chatRef);

      if (!docSnapshot.exists()) {
        console.log("Document not found!");
        return;
      }

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this For Everyone?"
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

  //logout functionality
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      auth.signOut();
      // localStorage.removeItem("lastSelectedUser")
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
    // localStorage.setItem("lastSelectedUser",JSON.stringify(user))
    setSearchQuery("");
    setShowSearchInput(false);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // useEffect(()=>{
  //   const storedUser=localStorage.getItem("lastSelectedUser")
  //   if(storedUser){
  //     setSelectedUser(JSON.parse(storedUser))
  //   }
  // },[])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const currentUserDetails = users.find(
    (user) => user.email === auth?.currentUser?.email
  );
  console.log(currentUserDetails)

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

  //search usesr filter
  const filterUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email
        ?.split("@")[0]
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  const backToContacts = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(true);
      setSelectedUser(null);
    }
  };

  // mike speaking functionality

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-us";
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        console.log(message);
        console.log(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("error occupied in speech recognization : ", event.error);
        setIsListening(false);
      };
    } else {
      toast.error("this browser is not support for speech recognization !");
    }

    return () => {
      if (recognization) {
        recognization.stop();
      }
    };
  }, []);

  const toggleListen = (e) => {
    // e.preventDefault(); 
    // console.log("toggleListen called");
    setIsListening(true);
    // console.log("isListening before toggle:", isListening);
    setIsListening((prev) => {
      console.log("prev isListening:", prev);
      return !prev;
    });
    // console.log("isListening after toggle:", !isListening);
  };

  useEffect(() => {
    console.log("useEffect - isListening:", isListening);
    if (recognization && isListening) {
      recognization.start();
    } else if (recognization && !isListening) {
      recognization.stop();
    }
  }, [isListening, recognization]);

   const lastReplyTime = messages
  .filter(msg => msg.uid !== currentUserDetails.uid)
  .at(-1)?.createdAt.toMillis();


  return (
    <div className="flex h-screen bg-[#131c2e] overflow-hidden">
      {windowWidth < 768 && selectedUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className="fixed top-3  left-2 z-30 bg-blue-600 p-2 rounded-md shadow-lg"
        >
          <FaBars className="text-white" />
        </button>
      )}

      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-full md:w-80 bg-[#1A2436] border-r border-gray-700 flex-shrink-0 
        md:static fixed top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out`}
      >
        <div className={` p-4 ${theme==="light"?"bg-[#1a2436]":"bg-white text-blue-900"} shadow-md flex items-center justify-between sticky top-0 z-10`}>
          <h2 className={`text-xl  font-bold text-center md:m-0 lg:m-0 xl-m-0 m-auto ${theme==="light"?"bg-[#1a2436] text-white":"bg-white text-blue-900"}`}>
            BaatChit
          </h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-gray-700" onClick={toggletheme}>
                 {theme==="light"?<MdDarkMode className="text-white" size={18} />:<CiLight className="text-white" size={18} />                 }
            </button>
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
                <FaTimes className="text-gray-200 text-xl" />
              </button>
            </div>
          </div>
        )}

        <div className={`pt-2 ${theme==="light"?"bg-[#1a2436]":"bg-white text-blue-900"} h-[calc(100%-60px)] overflow-y-auto`}>
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
                  <div className="text-white bg-gray-700 py-2 rounded-xl m-1 ps-2 flex items-center">
                    <span className="p-2 rounded-full px-4 bg-blue-500 me-4 flex-shrink-0">
                      {(
                        user.displayName?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"
                      ).toUpperCase()}
                    </span>
                    <span className="truncate">
                      {user.displayName ||
                        user.email?.split("@")[0] ||
                        "Unknown User"}
                    </span>
                  </div>
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
                      <span className="p-2 rounded-full px-4 bg-blue-500 me-4 flex-shrink-0">
                        {(contact.displayName?.charAt(0) || "U").toUpperCase()}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-medium truncate">
                          {contact.displayName}
                        </h3>
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
                      <div className="text-white bg-gray-700 hover:bg-gray-600 py-2 rounded-xl m-1 ps-2 flex items-center">
                        <span className="p-2 rounded-full px-4 bg-blue-500 me-4 flex-shrink-0">
                          {(
                            user.displayName?.charAt(0) ||
                            user.email?.charAt(0) ||
                            "U"
                          ).toUpperCase()}
                        </span>
                        <span className="truncate">
                          {user.displayName ||
                            user.email?.split("@")[0] ||
                            "Unknown User"}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-gray-400 p-4">
                  No other users found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`${
          !sidebarOpen || windowWidth >= 768
            ? "flex-1"
            : "hidden md:block md:flex-1"
        } flex flex-col ${theme==="light"?"bg-[#0F172A]":"bg-[#000] text-white "} shadow-md `}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}      
        
      >
        {/* Chat header */}
        <div
          className={` ${theme==="light"?"bg-[#1A2436] text-white":"bg-white text-gray-800 border-b-2 border-[#E7E7E7] shadow-2xl shadow-blue-500/20"} shadow-md  p-3 md:p-5 shadow-md flex items-center justify-between`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}

          st
        >
          <div className="flex items-center flex-1">
            {windowWidth < 768 && selectedUser && (
              <button onClick={backToContacts} className="text-white p-2 mr-2">
                <FaArrowLeft />
              </button>
            )}
            <h2 className="text-lg md:text-xl font-bold truncate">
              {selectedUser ? (
                <div className="flex items-center">
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2 flex-shrink-0">
                    {(
                      selectedUser.displayName?.charAt(0) ||
                      selectedUser.email?.charAt(0) ||
                      "U"
                    ).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[150px] md:max-w-[250px]">
                    {selectedUser.displayName ||
                      selectedUser.email?.split("@")[0] ||
                      "Unknown User"}
                  </span>
                </div>
              ) : (
                <span className="truncate">
                  Select a user to start chatting
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center sticky top-0">
            <h1 className="pe-3 hidden md:block truncate max-w-[150px]">
              {currentUserDetails?.displayName}
            </h1>
            <h1 className=" md:hidden lg:hidden xl:hidden  truncate max-w-[150px] bg-white text-[#0F172A] me-2 text-center px-2.5 py-0.5 rounded-full">
              {currentUserDetails?.displayName.charAt(0) ||
                currentUserDetails?.email.charAt(0)}
            </h1>
            <button
              onClick={handleLogout}
              className=" rounded-full hover:text-red-400"
            >
              <FaSignOutAlt className={`h-5 w-5 ${theme==="light"?"text-white":"text-black"}`} />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 md:p-4 space-y-4 ${theme==="light"?"":"bg-white"} `}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-inner opacity-100 bg-gradient-to-br from-blue-100 to-blue-600 shadow-md">
                <p className="text-white text-4xl md:text-6xl font-semibold">
                  {selectedUser?.displayName?.[0]?.toUpperCase() || "?"}
                </p>
              </div>
              <p className="mt-3 text-center text-lg md:text-xl font-semibold text-gray-300 tracking-wide">
                {selectedUser?.displayName?.toUpperCase() || "SELECT A USER"}
              </p>
              <p className="text-gray-600 pt-3 text-center px-4">
                {selectedUser
                  ? `No messages yet. Say hello to ${
                      selectedUser?.displayName ||
                      selectedUser?.email?.split("@")[0] ||
                      "them"
                    }!`
                  : "Select a user to begin chatting"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {messages.map((msg) => {
                const senderName = getSenderDisplayName(msg);
                const initial = getSenderInitial(msg);
                const isCurrentUser = msg.uid === auth.currentUser?.uid;
                const currentDocId = msg?.id;
                const messageTime = msg.localTimeStamp;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isCurrentUser && (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </div>
                    )}

                    <div
                      className={`relative max-w-[75%] md:max-w-[70%] rounded-lg py-2 px-3 shadow ${
                        isCurrentUser
                          ? "bg-gray-800 rounded-tr-none"
                          : "bg-gray-600 rounded-tl-none"
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="text-sm text-blue-300 font-semibold mb-1">
                          {senderName}
                        </div>
                      )}

                      {msg.isDeleted ? (
                        <p className="text-gray-400 italic text-sm">
                          {msg.text} 
                          
                        </p>
                      ) : (
                        <>
                        <div className="flex justify-between py-1">
                        {msg.images &&  <Link
                              to={msg.images}
                              download={`image_${Date.now()}.${msg.type}`}
                              className=" underline  ms-1 text-center  inline-block hover:text-blue-200"
                            >
                              <BsCloudDownloadFill size={20} />

                            </Link>}  <p className="text-white break-words flex justify-between items-center"><span>{msg.text}</span> <span>{isCurrentUser ? (<h1>{msg.uid==currentUserDetails.uid ? (<MdOutlineDoneAll className={`ms-2 ${lastReplyTime && msg.createdAt?.toMillis() < lastReplyTime?'text-blue-500':'text-gray-500'}`} />
                             ):(<h1 className="text-red-700">Retry !</h1>)}</h1>):("")}</span></p> </div>
                         
                          {msg.images && msg.images && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                              
                              
                              <img
                                src={msg.images}
                                alt="Sent image"
                                className="max-w-full h-auto rounded-lg"
                                onClick={()=>setSelectedImages(msg.images)}
                              /> 
                            
                            </div>
                          )}

                          {selectedImages && (
                            <div className="fixed inset-0 bg-opacity-70 flex items-center justify-center bg-black z-50" onClick={()=>setSelectedImages(false)}>
                                            <div className="flex-col"><MdOutlineCancel size={30} onClick={()=>setSelectedImages(false)} className="ms-auto mb-10" />
                                     <img src={selectedImages} alt="Preview" className="max-x-full max-h-full rounded-lg border" /> </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-400">
                              {messageTime}
                            </span>

                            {isCurrentUser && !msg.isDeleted && (
                              <button
                                onClick={() => deleteMessage(currentDocId)}
                                className="text-gray-400 hover:text-red-500 ml-2"
                                title="Delete message"
                              >
                                <FaTrashAlt size={12} />
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Message tail */}
                      <div
                        className={`absolute top-0 w-4 h-4 overflow-hidden ${
                          isCurrentUser
                            ? "right-0 transform translate-x-1/2 -translate-y-1/2"
                            : "left-0 transform -translate-x-1/2 -translate-y-1/2"
                        }`}
                      >
                        {/* <div
                          className={`absolute transform rotate-45 w-4 h-4 ${
                            isCurrentUser ? "bg-[#065f46]" : "bg-[#1f2937]"
                          }`}
                        ></div> */}
                      </div>
                    </div>

                    {isCurrentUser && (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {/* bg-[#1a2436] */}
        {selectedUser && (
          <div className={`p-2 ${theme==="light"?"bg-[#1a2436]":"bg-white border-white"} border-t border-gray-700`}>
            {imageFiles.length > 0 && (
              <div className={`flex flex-wrap gap-2 mb-2 p-2 ${theme==="light"?"bg-gray-800":"bg-white border-white"}  rounded-lg`}>
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="h-30 w-30 object-cover rounded-md"
                    />
                    <button
                      onClick={() => handleCancel(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"
                    >
                      <FaTimes size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 fixed-bottom-form"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full p-3 pr-10 bg-gray-700 text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!selectedUser}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                />

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <FaSmile />
                </button>

                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 z-10 w-[250px] sm:w-[350px] md:[300px] md:ps-10 lg:[400px]  "
                  >
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={imageInputRef}
                // maxLength={10}
                multiple
              />

              <button
                type="button"
                onClick={triggerImageUpload}
                className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                disabled={!selectedUser}
              >
                <FaImage />
              </button>
              <button onClick={toggleListen}>
                <FaMicrophone color={isListening ? "green" : "gray"} />
              </button>

              <button
                type="submit"
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  !selectedUser ||
                  (message.trim() === "" && imageFiles.length === 0)
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
