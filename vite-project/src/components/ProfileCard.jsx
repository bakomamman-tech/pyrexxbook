import { useState } from "react";
import "./ProfileCard.css";

function ProfileCard({ user }) {
  const [tab, setTab] = useState("posts");

  return (
    <div className="profile-page">

      {/* Cover + Profile */}
      <div className="profile-header">
        <img
          className="cover"
          src={`https://pyrexxbook-backend.onrender.com${user.cover}`}
          alt=""
        />

        <div className="profile-info">
          <img
            className="avatar"
            src={`https://pyrexxbook-backend.onrender.com${user.avatar}`}
            alt=""
          />
          <div>
            <h2>{user.name}</h2>
            <p>@{user.username}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <span onClick={() => setTab("posts")} className={tab==="posts" ? "active" : ""}>Posts</span>
        <span onClick={() => setTab("about")} className={tab==="about" ? "active" : ""}>About</span>
        <span onClick={() => setTab("photos")} className={tab==="photos" ? "active" : ""}>Photos</span>
        <span onClick={() => setTab("followers")} className={tab==="followers" ? "active" : ""}>Followers</span>
      </div>

      {/* Content */}
      <div className="profile-content">
        {tab === "posts" && <p>No posts yet</p>}
        {tab === "about" && <p>{user.bio}</p>}
        {tab === "photos" && <p>Photos will appear here</p>}
        {tab === "followers" && <p>{user.friends.length} followers</p>}
      </div>

    </div>
  );
}

export default ProfileCard;
