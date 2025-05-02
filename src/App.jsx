import React from "react";
import Login from "./Components/Login";
import { Route, Router, Routes } from "react-router-dom";
import ChatRoom from "./Components/ChatRoom";
// import Private from "./Components/Private";

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/group" element={<ChatRoom />} />
        {/* <Route path="/messages/:roomId" element={<Private />} /> */}
      </Routes>
  
  );
};

export default App;
