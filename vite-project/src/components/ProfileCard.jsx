import { useState } from "react";

function ProfileCard() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [bio, setBio] = useState(user.bio || "");
  const [saving, setSaving] = useState(false);

  const saveBio = () => {
    setSaving(true);

    fetch("http://localhost:5000/api/users/bio", {
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

  return (
    <div style={{
      background: "white",
      padding: 15,
      borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
      marginBottom: 20
    }}>
      <img
        src={`http://localhost:5000${user.avatar}`}
        width="80"
        style={{ borderRadius: "50%" }}
      />

      <h3>{user.name}</h3>

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
