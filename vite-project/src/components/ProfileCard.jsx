import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../utils/api";

function ProfileCard() {
  const { username } = useParams();
  const loggedIn = JSON.parse(localStorage.getItem("user"));

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

  /* Load timeline */
  useEffect(() => {
    fetch(`${API_BASE}/api/users/${username}/posts`)
      .then(res => res.json())
      .then(setPosts);
  }, [username]);

  if (!user) return <h2 style={{ textAlign: "center" }}>Loading…</h2>;

  const isMe = loggedIn?.id === user.id;
  const isFriend = user.friends?.includes(loggedIn?.id);
  const hasRequested = user.requests?.includes(loggedIn?.id);

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

  /* Avatar */
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

  /* Cover */
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

  /* Friend Request */
  const sendRequest = () => {
    fetch(`${API_BASE}/api/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: loggedIn.id,
        toUserId: user.id
      })
    }).then(() => alert("Friend request sent"));
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Cover */}
        <div style={{ ...styles.cover, backgroundImage: `url(${API_BASE}${user.cover})` }}>
          {isMe && (
            <label style={styles.coverBtn}>
              Change cover
              <input type="file" hidden onChange={e => setCover(e.target.files[0])} />
            </label>
          )}
          {cover && <button style={styles.saveCover} onClick={uploadCover}>Save</button>}
        </div>

        {/* Avatar */}
        <div style={styles.avatarWrap}>
          <img src={`${API_BASE}${user.avatar}`} style={styles.avatar} />
          {isMe && (
            <>
              <input type="file" onChange={e => setFile(e.target.files[0])} />
              <button onClick={uploadAvatar}>Change photo</button>
            </>
          )}
        </div>

        {/* Name */}
        <h2 style={styles.name}>{user.name}</h2>
        <p style={styles.username}>@{user.username}</p>

        {/* Friend button */}
        {!isMe && !isFriend && !hasRequested && (
          <button style={styles.saveBio} onClick={sendRequest}>Add Friend</button>
        )}

        {!isMe && hasRequested && (
          <p style={{ textAlign: "center", color: "gray" }}>Request sent</p>
        )}

        {/* Bio */}
        {isMe && (
          <>
            <textarea value={bio} onChange={e => setBio(e.target.value)} style={styles.bio} />
            <button onClick={saveBio} style={styles.saveBio}>
              {saving ? "Saving…" : "Save bio"}
            </button>
          </>
        )}

        {!isMe && <p style={{ padding: 20 }}>{user.bio}</p>}

        {/* Timeline */}
        <h3 style={{ paddingLeft: 20, marginTop: 30 }}>Posts</h3>

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
  page: { display: "flex", justifyContent: "center", background: "#f0f2f5", padding: 15, minHeight: "100vh" },
  card: { width: "100%", maxWidth: 700, background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.1)" },
  cover: { height: 220, backgroundSize: "cover", backgroundPosition: "center", position: "relative" },
  coverBtn: { position: "absolute", right: 10, bottom: 10, background: "rgba(0,0,0,.7)", color: "white", padding: "6px 10px", borderRadius: 6 },
  saveCover: { position: "absolute", right: 10, bottom: 50, background: "#1877f2", color: "white", border: "none", padding: "6px 12px", borderRadius: 6 },
  avatarWrap: { textAlign: "center", marginTop: -70 },
  avatar: { width: 140, height: 140, borderRadius: "50%", border: "5px solid white", objectFit: "cover" },
  name: { textAlign: "center", marginTop: 10 },
  username: { textAlign: "center", color: "gray" },
  bio: { width: "90%", margin: "20px auto", display: "block", padding: 10, minHeight: 80 },
  saveBio: { display: "block", margin: "10px auto", background: "#1877f2", color: "white", border: "none", padding: "8px 20px", borderRadius: 6 },
  post: { margin: 15, padding: 15, background: "#f0f2f5", borderRadius: 10 },
  postHeader: { display: "flex", alignItems: "center", gap: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: "50%" },
  postText: { marginTop: 10 }
};
