import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../utils/api";

function ProfileCard() {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [saving, setSaving] = useState(false);

  /* Load profile */
  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setBio(data.bio || "");
      });
  }, [username]);

  /* Load timeline posts */
  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}/posts`)
      .then(res => res.json())
      .then(setPosts);
  }, [username]);

  if (!user) return <h2 style={{ textAlign: "center" }}>Loading…</h2>;

  /* Save bio */
  const saveBio = () => {
    setSaving(true);
    fetch(`${API_BASE}/api/users/bio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, bio })
    })
      .then(res => res.json())
      .then(u => {
        setUser(u);
        setSaving(false);
      });
  };

  /* Upload avatar */
  const uploadAvatar = () => {
    const form = new FormData();
    form.append("avatar", file);

    fetch(`${API_BASE}/api/users/${user.id}/avatar`, {
      method: "POST",
      body: form
    })
      .then(res => res.json())
      .then(setUser);
  };

  /* Upload cover */
  const uploadCover = () => {
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

        {/* Cover */}
        <div
          style={{
            ...styles.cover,
            backgroundImage: `url(${API_BASE}${user.cover})`
          }}
        >
          <label style={styles.coverBtn}>
            Change cover
            <input type="file" hidden onChange={e => setCover(e.target.files[0])} />
          </label>
          {cover && <button style={styles.saveCover} onClick={uploadCover}>Save</button>}
        </div>

        {/* Avatar */}
        <div style={styles.avatarWrap}>
          <img src={`${API_BASE}${user.avatar}`} style={styles.avatar} />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <button onClick={uploadAvatar}>Change photo</button>
        </div>

        {/* Name */}
        <h2 style={styles.name}>{user.name}</h2>
        <p style={styles.username}>@{user.username}</p>

        {/* Bio */}
        <textarea value={bio} onChange={e => setBio(e.target.value)} style={styles.bio} />
        <button onClick={saveBio} style={styles.saveBio}>
          {saving ? "Saving…" : "Save bio"}
        </button>

        {/* TIMELINE */}
        <h3 style={{ marginTop: 40, paddingLeft: 20 }}>Posts</h3>

        {posts.length === 0 && (
          <p style={{ padding: 20, color: "gray" }}>No posts yet.</p>
        )}

        {posts.map(post => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postHeader}>
              <img src={`${API_BASE}${post.avatar}`} style={styles.postAvatar} />
              <div>
                <strong>{post.name}</strong>
                <div style={{ fontSize: 12, color: "gray" }}>{post.time}</div>
              </div>
            </div>
            <div style={styles.postText}>{post.text}</div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default ProfileCard;

/* STYLES */

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    background: "#f0f2f5",
    padding: 15,
    minHeight: "100vh"
  },
  card: {
    width: "100%",
    maxWidth: 700,
    background: "white",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,.1)"
  },
  cover: {
    height: 220,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative"
  },
  coverBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    background: "rgba(0,0,0,.7)",
    color: "white",
    padding: "6px 10px",
    borderRadius: 6
  },
  saveCover: {
    position: "absolute",
    right: 10,
    bottom: 50,
    background: "#1877f2",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6
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
  name: { textAlign: "center", marginTop: 10 },
  username: { textAlign: "center", color: "gray" },
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
    background: "#1877f2",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: 6
  },
  post: {
    margin: 15,
    padding: 15,
    background: "#f0f2f5",
    borderRadius: 10
  },
  postHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%"
  },
  postText: {
    marginTop: 10
  }
};
