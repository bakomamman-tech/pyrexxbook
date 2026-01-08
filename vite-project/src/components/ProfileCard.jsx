import { useState } from "react";
import API_BASE from "../utils/api";
import "./ProfileCard.css";

function ProfileCard({ user }) {
  const [tab, setTab] = useState("posts");
  const [profile, setProfile] = useState(user);
  const [logged, setLogged] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  if (!profile || !logged) {
    return <div style={{ padding: 20 }}>Loading profile…</div>;
  }

  const isFollowing = logged.following?.includes(profile._id);
  const isFriend =
    isFollowing && profile.followers?.includes(logged._id);

  const follow = async () => {
    const res = await fetch(
      `${API_BASE}/api/users/follow/${profile._id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: logged._id })
      }
    );

    const data = await res.json();

    // Update viewed profile
    setProfile(prev => ({
      ...prev,
      followers: data.followers
    }));

    // Update logged-in user safely
    const updatedLogged = {
      ...logged,
      following: data.following
    };

    setLogged(updatedLogged);
    localStorage.setItem("user", JSON.stringify(updatedLogged));
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          className="cover"
          src={`${API_BASE}${profile.cover || "/uploads/cover-default.jpg"}`}
          alt="cover"
        />

        <div className="profile-info">
          <img
            className="avatar"
            src={`${API_BASE}${profile.avatar || "/uploads/default.png"}`}
            alt="avatar"
          />

          <div>
            <h2>{profile.name}</h2>
            <p>@{profile.username}</p>
            <p>{profile.followers?.length || 0} followers</p>
          </div>

          {logged._id !== profile._id && (
            <button className="follow-btn" onClick={follow}>
              {isFriend
                ? "Friends"
                : isFollowing
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <span onClick={() => setTab("posts")} className={tab === "posts" ? "active" : ""}>Posts</span>
        <span onClick={() => setTab("about")} className={tab === "about" ? "active" : ""}>About</span>
        <span onClick={() => setTab("photos")} className={tab === "photos" ? "active" : ""}>Photos</span>
        <span onClick={() => setTab("followers")} className={tab === "followers" ? "active" : ""}>Followers</span>
      </div>

      <div className="profile-content">
        {tab === "posts" && <p>No posts yet</p>}
        {tab === "about" && <p>{profile.bio || "No bio yet"}</p>}
        {tab === "photos" && <p>Photos will appear here</p>}
        {tab === "followers" && (
          <p>{profile.followers?.length || 0} followers</p>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;
