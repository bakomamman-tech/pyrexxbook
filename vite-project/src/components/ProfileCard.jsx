import { useState } from "react";
import { authFetch, avatarUrl, getStoredUser, storeSession } from "../utils/api";
import "./ProfileCard.css";

export default function ProfileCard({ user }) {
  const [profile, setProfile] = useState(user);
  const [viewer, setViewer] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!profile || !viewer) {
    return <div className="profile-content">Profile unavailable.</div>;
  }

  const isSelf = String(viewer._id) === String(profile._id);
  const isFollowing = viewer.following?.includes(profile._id);

  const toggleFollow = async () => {
    if (loading || isSelf) return;
    setLoading(true);
    setError("");

    try {
      const payload = await authFetch(`/api/users/follow/${profile._id}`, {
        method: "POST"
      });

      const nextViewer = {
        ...viewer,
        following: payload.following || viewer.following || []
      };

      setViewer(nextViewer);
      setProfile((prev) => ({
        ...prev,
        followers: payload.followers || prev.followers || []
      }));
      storeSession({ user: nextViewer });
    } catch (err) {
      setError(err.message || "Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-header">
        <img className="cover" src={avatarUrl({ avatar: profile.cover, name: profile.name })} alt="" />

        <div className="profile-info">
          <img className="avatar" src={avatarUrl(profile)} alt={profile.name} />

          <div>
            <h2>{profile.name}</h2>
            <p>@{profile.username}</p>
            <p>{profile.followers?.length || 0} followers</p>
          </div>

          {!isSelf && (
            <button className="follow-btn" onClick={toggleFollow} disabled={loading}>
              {loading ? "Updating..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="profile-error">{error}</p>}
    </section>
  );
}
