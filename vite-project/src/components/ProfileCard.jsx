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
  const isFollower = profile.followers?.includes(logged._id);
  const isFriend = isFollowing && isFollower;

  const hasSentRequest = profile.friendRequests?.includes(logged._id);
  const hasIncomingRequest = logged.friendRequests?.includes(profile._id);

  /* ================= ACTIONS ================= */

  const sendRequest = async () => {
    await fetch(`${API_BASE}/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromId: logged._id,
        toId: profile._id
      })
    });

    setProfile(prev => ({
      ...prev,
      friendRequests: [...(prev.friendRequests || []), logged._id]
    }));
  };

  const acceptRequest = async () => {
    await fetch(`${API_BASE}/friends/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: logged._id,
        requesterId: profile._id
      })
    });

    const updatedLogged = {
      ...logged,
      followers: [...logged.followers, profile._id],
      following: [...logged.following, profile._id],
      friendRequests: logged.friendRequests.filter(id => id !== profile._id)
    };

    setLogged(updatedLogged);
    localStorage.setItem("user", JSON.stringify(updatedLogged));

    setProfile(prev => ({
      ...prev,
      followers: [...prev.followers, logged._id],
      following: [...(prev.following || []), logged._id]
    }));
  };

  const rejectRequest = async () => {
    await fetch(`${API_BASE}/friends/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: logged._id,
        requesterId: profile._id
      })
    });

    const updatedLogged = {
      ...logged,
      friendRequests: logged.friendRequests.filter(id => id !== profile._id)
    };

    setLogged(updatedLogged);
    localStorage.setItem("user", JSON.stringify(updatedLogged));
  };

  /* ================= BUTTON LOGIC ================= */

  const renderButton = () => {
    if (isFriend) return <button className="follow-btn">Friends</button>;
    if (hasSentRequest) return <button className="follow-btn">Requested</button>;
    if (hasIncomingRequest)
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="follow-btn" onClick={acceptRequest}>Accept</button>
          <button className="follow-btn danger" onClick={rejectRequest}>Decline</button>
        </div>
      );

    return <button className="follow-btn" onClick={sendRequest}>Add Friend</button>;
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

          {logged._id !== profile._id && renderButton()}
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
