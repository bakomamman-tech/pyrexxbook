import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Feed from "./Feed";
import ProfileCard from "./components/ProfileCard";
import "./index.css";   // 👈 ADD THIS LINE

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Feed />} />
        <Route path="profile/:username" element={<ProfileCard />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
