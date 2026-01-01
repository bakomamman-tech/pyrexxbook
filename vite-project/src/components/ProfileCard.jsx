import { useState } from "react";
import "./ProfileCard.css";

function ProfileCard({ user }) {
  const [tab, setTab] = useState("posts");

  // Prevent crash while data is loading
  if (!user) {
    return <div style={{ padding: 20 }}>Loading profile…</div>;
  }

  return (
    <div className="profile-page">

      {/* Cover + Profile */}
      <div className="profile-header">
        <img
          className="cover"
          src={`https://pyrexxbook-backend.onrender.com${user?.cover || "/uploads/cover-default.jpg"}`}
          alt="cover"
        />

        <div className="profile-info">
          <img
            className="avatar"
            src={`https://pyrexxbook-backend.onrender.com${user?.avatar || "/uploads/default.png"}`}
            alt="avatar"
          />
          <div>
            <h2>{user?.name || "User"}</h2>
            <p>@{user?.username || ""}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <span onClick={() => setTab("posts")} className={tab === "posts" ? "active" : ""}>Posts</span>
        <span onClick={() => setTab("about")} className={tab === "about" ? "active" : ""}>About</span>
        <span onClick={() => setTab("photos")} className={tab === "photos" ? "active" : ""}>Photos</span>
        <span onClick={() => setTab("followers")} className={tab === "followers" ? "active" : ""}>Followers</span>
      </div>

      {/* Content */}
      <div className="profile-content">
        {tab === "posts" && <p>No posts yet</p>}
        {tab === "about" && <p>{user?.bio || "No bio yet"}</p>}
        {tab === "photos" && <p>Photos will appear here</p>}
        {tab === "followers" && <p>{user?.friends?.length || 0} followers</p>}
      </div>

    </div>
  );
}

export default ProfileCard;
