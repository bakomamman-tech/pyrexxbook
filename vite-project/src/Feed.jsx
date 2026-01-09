import { useEffect, useState } from "react";
import ProfileCard from "./components/ProfileCard";
import StoryBar from "./components/StoryBar";
import Messenger from "./components/Messenger";
import API_BASE from "./utils/api";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [showMessenger, setShowMessenger] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const avatarUrl = (name, avatar) => {
    if (!avatar)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}`;
    if (avatar.startsWith("http")) return avatar;
    return `${API_BASE.replace("/api", "")}${avatar}`;
  };

  /* ================= LOAD POSTS ================= */
  useEffect(() => {
    if (!user) return;

    fetch(`${API_BASE}/posts`)
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [user]);

  const reload = async () => {
    const res = await fetch(`${API_BASE}/posts`);
    setPosts(await res.json());
  };

  const createPost = async () => {
    if (!text.trim()) return;

    await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, text })
    });

    setText("");
    reload();
  };

  const toggleLike = async id => {
    await fetch(`${API_BASE}/posts/like/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id })
    });
    reload();
  };

  const addComment = async id => {
    if (!commentText[id]) return;

    await fetch(`${API_BASE}/posts/comment/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, text: commentText[id] })
    });

    setCommentText({ ...commentText, [id]: "" });
    reload();
  };

  if (!user) return <div>Please login</div>;
  if (loading) return <div>Loading…</div>;

  return (
    <div className="feed-container">
      <ProfileCard user={user} />
      <StoryBar user={user} />

      <div className="create-post">
        <img src={avatarUrl(user.name, user.avatar)} />
        <textarea
          placeholder={`What's on your mind, ${user.name}?`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button onClick={createPost}>Post</button>
      </div>

      {posts.map(p => (
        <div key={p._id} className="post">
          <strong>{p.name}</strong>
          <p>{p.text}</p>

          <button onClick={() => toggleLike(p._id)}>
            ❤️ {p.likes?.length || 0}
          </button>

          {p.comments?.map((c, i) => (
            <div key={i}>{c.text}</div>
          ))}

          <input
            placeholder="Write a comment..."
            value={commentText[p._id] || ""}
            onChange={e =>
              setCommentText({ ...commentText, [p._id]: e.target.value })
            }
          />
          <button onClick={() => addComment(p._id)}>Send</button>
        </div>
      ))}

      <button
        className="messenger-fab"
        onClick={() => setShowMessenger(true)}
      >
        ⚡
      </button>

      {showMessenger && (
        <Messenger
          user={user}
          onClose={() => setShowMessenger(false)}
        />
      )}
    </div>
  );
}
