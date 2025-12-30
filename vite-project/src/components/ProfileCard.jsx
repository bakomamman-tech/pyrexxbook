import API_BASE from "../utils/api";
import { useState } from "react";

function ProfileCard() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [bio, setBio] = useState(user.bio || "");
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const saveBio = () => {
    setSaving(true);

    fetch(`${API_BASE}/api/users/bio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, bio })
    })
      .then(res => res.json())
      .then(updated => {
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setSaving(false);
      });
  };

  const uploadAvatar = () => {
    if (!file) return alert("Choose an image first");

    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    fetch(`${API_BASE}/api/users/${user.id}/avatar`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(updated => {
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setUploading(false);
      });
  };

  return (
    <div style={{
      background: "white",
      padding: 15,
      borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
      marginBottom: 20
    }}>
      
      {/* Profile picture */}
      <img
        src={`${API_BASE}${user.avatar}`}
        width="80"
        height="80"
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />

      <br />

      {/* Upload new avatar */}
      <input
        type="file"
        onChange={e => setFile(e.target.files[0])}
        style={{ marginTop: 10 }}
      />

      <button
        onClick={uploadAvatar}
        disabled={uploading}
        style={{
          marginTop: 5,
          background: "#28a745",
          color: "white",
          border: "none",
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        {uploading ? "Uploading..." : "Change Photo"}
      </button>

      <h3>{user.name}</h3>

      {/* Bio editor */}
      <textarea
        value={bio}
        onChange={e => setBio(e.target.value)}
        placeholder="Write your bio..."
        style={{
          width: "100%",
          borderRadius: 8,
          padding: 10,
          border: "1px solid #ddd",
          resize: "none"
        }}
      />

      <button
        onClick={saveBio}
        disabled={saving}
        style={{
          marginTop: 10,
          background: "#1877f2",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {saving ? "Saving..." : "Save Bio"}
      </button>

    </div>
  );
}

export default ProfileCard;
