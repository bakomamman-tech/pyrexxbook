import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Feed from "./Feed";

function App() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const isLoggedIn = Boolean(user);

  return (
    <>
      {isLoggedIn && <Navbar />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTE */}
        <Route
          path="/"
          element={isLoggedIn ? <Feed /> : <Navigate to="/login" />}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
