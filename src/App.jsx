import React from "react";
import Login from "./Components/Login";
import { Route, Router, Routes } from "react-router-dom";
import ChatRoom from "./Components/ChatRoom";
import SignUp from "./Components/SignUp";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// import Private from "./Components/Private";

const App = () => {
  return (
    <>
<ToastContainer
  position="top-center"
  autoClose={2000}
  className="w-[90%] sm:w-[60%] md:w-[60%] lg:w-[40%] xl:w-[30%] mx-auto"
/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/group" element={<ChatRoom />} />
        <Route path="/signup" element={<SignUp />} />
        
      </Routes>
  </>
  );
};

export default App;
