import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../utils/api";

function ProfileCard() {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Load profile
    fetch(`${API_BASE}/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setBio(data.bio || "");
      });

    // Load timeline
    fetch(`${API_BASE}/api/users/${username}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data || []));
  }, [username]);

  if (!user) {
    return <h2 style={{ textAlign: "center" }}>Loading profile…</h2>;
  }

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
    if (!file) return;

    const form = new FormData();
    form.append("avatar", file);

    fetch(`${API_BASE}/api/users/${user.id}/avatar`, {
      method: "POST",
      body: form
    })
      .then(res => res.json())
      .then(setUser);
  };

  const uploadCover = () => {
    if (!cover) return;

    const form = new FormData();
    form.append("cover", cover);

    fetch(`${API_BASE}/api/users/${user.id}/cover`, {
      method: "POST",
      body: form
    })
      .then(res => res.json())
      .then(setUser);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* COVER */}
        <div
          style={{
            ...styles.cover,
            backgroundImage: `url(${API_BASE}${user.cover})`
          }}
        >
          <label style={styles.coverBtn}>
            Change Cover
            <input
              type="file"
              hidden
              onChange={e => setCover(e.target.files[0])}
            />
          </label>

          {cover && (
            <button onClick={uploadCover} style={styles.saveCover}>
              Save
            </button>
          )}
        </div>

        {/* AVATAR */}
        <div style={styles.avatarWrap}>
          <img
            src={`${API_BASE}${user.avatar}`}
            alt={user.name}
            style={styles.avatar}
          />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <button onClick={uploadAvatar}>Change Photo</button>
        </div>

        {/* NAME */}
        <h2 style={styles.name}>{user.name}</h2>
        <p style={styles.username}>@{user.username}</p>

        {/* BIO */}
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          style={styles.bio}
        />

        <button onClick={saveBio} style={styles.saveBio}>
          {saving ? "Saving..." : "Save Bio"}
        </button>

        {/* TIMELINE */}
        <div style={styles.timeline}>
          <h3>Posts</h3>

          {posts.map(post => (
            <div key={post.id} style={styles.post}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={`${API_BASE}${post.avatar}`}
                  style={styles.postAvatar}
                />
                <strong>{post.name}</strong>
              </div>

              <p style={{ marginTop: 10 }}>{post.text}</p>
              <small style={{ color: "gray" }}>{post.time}</small>
            </div>
          ))}

          {posts.length === 0 && (
            <p style={{ textAlign: "center", color: "gray" }}>
              No posts yet
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProfileCard;

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    background: "#f0f2f5",
    padding: 20,
    minHeight: "100vh"
  },

  card: {
    background: "white",
    width: "100%",
    maxWidth: 700,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
  },

  cover: {
    height: 220,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative"
  },

  coverBtn: {
    position: "absolute",
    right: 15,
    bottom: 15,
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },

  saveCover: {
    position: "absolute",
    right: 15,
    bottom: 55,
    background: "#1877f2",
    color: "white",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

  avatarWrap: {
    textAlign: "center",
    marginTop: -70
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    border: "5px solid white",
    objectFit: "cover"
  },

  name: {
    textAlign: "center",
    marginTop: 10
  },

  username: {
    textAlign: "center",
    color: "gray"
  },

  bio: {
    width: "90%",
    margin: "20px auto",
    display: "block",
    padding: 10,
    minHeight: 80
  },

  saveBio: {
    display: "block",
    margin: "auto",
    padding: "8px 20px",
    background: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },

  timeline: {
    marginTop: 40,
    padding: "0 20px"
  },

  post: {
    background: "#f0f2f5",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10
  },

  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    marginRight: 10
  }
};
