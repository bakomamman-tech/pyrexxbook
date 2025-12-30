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

  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setBio(data.bio || "");
      });
  }, [username]);

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
      });
  };

  return (
    <div style={{ background: "white", padding: 20 }}>
      <img
        src={`${API_BASE}${user.avatar}`}
        width="100"
        height="100"
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />

      <h2>{user.name} <small>@{user.username}</small></h2>

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
