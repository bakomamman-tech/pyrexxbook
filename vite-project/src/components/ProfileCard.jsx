import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../utils/api";

function ProfileCard() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load user by username
  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("User not found");
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setBio(data.bio || "");
      })
      .catch(err => {
        console.error(err);
        setError("Profile not found");
      });
  }, [username]);

  // 🔥 Diagnostic output
  if (error) return <h1 style={{ color: "red" }}>{error}</h1>;
  if (!user) return <h1 style={{ color: "blue" }}>Loading profile...</h1>;

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
      })
      .catch(() => setSaving(false));
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
        setUser(updated);
        setUploading(false);
      })
      .catch(() => setUploading(false));
  };

  return (
    <div style={{ background: "white", padding: 20 }}>
      <h1 style={{ color: "green" }}>PROFILE PAGE LOADED</h1>

      <img
        src={`${API_BASE}${user.avatar}`}
        width="120"
        height="120"
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />

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

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadAvatar}>
        {uploading ? "Uploading..." : "Change Photo"}
      </button>
    </div>
  );
}

export default ProfileCard;
