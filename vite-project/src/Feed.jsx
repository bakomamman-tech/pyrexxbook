import { useEffect, useState } from "react";
import ProfileCard from "./components/ProfileCard";
import StoryBar from "./components/StoryBar";
import ImageModal from "./components/ImageModal";
import Messenger from "./components/Messenger";
import API_BASE from "./utils/api";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMessenger, setShowMessenger] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  /* ===== SAFE AVATAR ===== */
  const avatarUrl = (name, avatar) => {
    if (!avatar)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "User"
      )}&background=C3005E&color=fff`;
    if (avatar.startsWith("http")) return avatar;
    return `${API_BASE.replace("/api", "")}${avatar}`;
  };

  /* ===== LOAD FEED ===== */
  useEffect(() => {
    if (!user) return;

    fetch(`${API_BASE}/posts`)
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [user]);

  const reload = async () => {
    const res = await fetch(`${API_BASE}/posts`);
    const data = await res.json();
    setPosts(data);
  };

  const createPost = async () => {
    if (!text.trim()) return;

    await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        text
      })
    });

    setText("");
    reload();
  };

  const toggleLike = async postId => {
    await fetch(`${API_BASE}/posts/like/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id })
    });

    reload();
  };

  const addComment = async postId => {
    if (!commentText[postId]) return;

    await fetch(`${API_BASE}/posts/comment/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        text: commentText[postId]
      })
    });

    setCommentText({ ...commentText, [postId]: "" });
    reload();
  };

  if (!user) return <div style={{ padding: 20 }}>Please log in</div>;
  if (loading) return <div style={{ padding: 20 }}>Loading feed…</div>;

  return (
    <div className="feed-container">
      <ProfileCard user={user} />
      <StoryBar user={user} />

      <div className="create-post">
        <img src={avatarUrl(user.name, user.avatar)} alt="" />
        <textarea
          placeholder={`What's on your mind, ${user.name}?`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button onClick={createPost}>Post</button>
      </div>

      {posts.map(post => (
        <div className="post" key={post._id}>
          <div className="post-header">
            <img src={avatarUrl(post.name, post.avatar)} alt="" />
            <div>
              <div className="post-name">{post.name}</div>
              <div className="post-time">{post.time}</div>
            </div>
          </div>

          <div className="post-text">{post.text}</div>

          <div className="post-actions">
            <button onClick={() => toggleLike(post._id)}>
              {post.likes?.includes(user._id) ? "❤️" : "🤍"}{" "}
              {post.likes?.length || 0}
            </button>
          </div>

          <div className="comments">
            {post.comments?.map((c, i) => (
              <div key={i} className="comment">
                <strong>{c.userId === user._id ? "You" : "User"}:</strong>{" "}
                {c.text}
              </div>
            ))}

            <div className="comment-box">
              <input
                placeholder="Write a comment..."
                value={commentText[post._id] || ""}
                onChange={e =>
                  setCommentText({ ...commentText, [post._id]: e.target.value })
                }
              />
              <button onClick={() => addComment(post._id)}>Post</button>
            </div>
          </div>
        </div>
      ))}

      {/* ===== MESSENGER BUTTON ===== */}
      <button
        className="messenger-fab"
        style={{ zIndex: 2000 }}
        onClick={() => {
          console.log("⚡ Messenger open");
          setShowMessenger(true);
        }}
      >
        ⚡
      </button>

      {/* ===== FORCE MESSENGER RENDER ===== */}
      {showMessenger && user && (
        <Messenger user={user} onClose={() => setShowMessenger(false)} />
      )}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
