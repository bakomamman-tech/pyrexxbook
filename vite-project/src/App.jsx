import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import Feed from "./Feed";
import socket from "./socket";

function App() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const isLoggedIn = Boolean(user?._id);

  /* ================= SOCKET BOOT ================= */

  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join", user._id);

    socket.on("friendRequest", data => {
      alert(`👋 ${data.name} sent you a friend request`);
    });

    socket.on("friendAccepted", data => {
      alert(`🤝 ${data.name} accepted your friend request`);
    });

    return () => {
      socket.off("friendRequest");
      socket.off("friendAccepted");
    };
  }, [user]);

  return (
    <>
      {isLoggedIn && <Navbar />}

      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PRIVATE */}
        <Route
          path="/"
          element={isLoggedIn ? <Feed /> : <Navigate to="/login" />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/" : "/login"} />}
        />
      </Routes>
    </>
  );
}

export default App;
