import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../utils/api";

function ProfileCard() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}`)
      .then(res => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then(data => {
        setUser(data);
        setBio(data.bio || "");
      })
      .catch(() => setError("Profile not found"));
  }, [username]);

  if (error) return <h2>{error}</h2>;
  if (!user) return <h2>Loading profile...</h2>;

  const saveBio = () => {
    setSaving(true);
    fetch(`${API_BASE}/api/users/bio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, bio })
    })
      .then(res => res.json())
      .then(updated => {
        setUser(updated);
        setSaving(false);
      });
  };

  const uploadAvatar = () => {
    if (!avatarFile) return alert("Choose an image first");

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    fetch(`${API_BASE}/api/users/${user.id}/avatar`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(updated => {
        setUser(updated);
        setUploadingAvatar(false);
      });
  };

  const uploadCover = () => {
    if (!coverFile) return alert("Choose a cover image");

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("cover", coverFile);

    fetch(`${API_BASE}/api/users/${user.id}/cover`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(updated => {
        setUser(updated);
        setUploadingCover(false);
      });
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* COVER */}
      <div style={{ position: "relative" }}>
        <img
          src={`${API_BASE}${user.cover}`}
          alt="cover"
          style={{
            width: "100%",
            height: "220px",
            objectFit: "cover"
          }}
        />

        <input
          type="file"
          onChange={e => setCoverFile(e.target.files[0])}
          style={{ position: "absolute", top: 10, right: 10 }}
        />
        <button
          onClick={uploadCover}
          style={{ position: "absolute", top: 40, right: 10 }}
        >
          {uploadingCover ? "Uploading..." : "Change Cover"}
        </button>

        {/* AVATAR */}
        <img
          src={`${API_BASE}${user.avatar}`}
          alt="avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid white",
            position: "absolute",
            bottom: -60,
            left: 20,
            background: "#fff"
          }}
        />
      </div>

      {/* PROFILE INFO */}
      <div style={{ padding: "80px 20px 20px" }}>
        <h2>
          {user.name} <small>@{user.username}</small>
        </h2>

        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />

        <button onClick={saveBio}>
          {saving ? "Saving..." : "Save Bio"}
        </button>

        <br /><br />

        <input type="file" onChange={e => setAvatarFile(e.target.files[0])} />
        <button onClick={uploadAvatar}>
          {uploadingAvatar ? "Uploading..." : "Change Photo"}
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;
