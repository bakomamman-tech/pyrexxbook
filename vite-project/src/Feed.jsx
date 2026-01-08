import { useEffect, useState } from "react";
import ProfileCard from "./components/ProfileCard";
import StoryBar from "./components/StoryBar";
import ImageModal from "./components/ImageModal";
import API_BASE from "./utils/api";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const avatarUrl = (name, avatar) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=C3005E&color=fff`;
    }
    if (avatar.startsWith("http")) return avatar;
    return `${API_BASE}${avatar}`;
  };

  // ✅ Load posts when component mounts OR user changes
  useEffect(() => {
    if (!user) return;

    fetch(`${API_BASE}/api/posts`)
      .then(res => res.json())
      .then(data => setPosts(data || []))
      .catch(console.error);
  }, [user]);

  const reloadPosts = async () => {
    const res = await fetch(`${API_BASE}/api/posts`);
    setPosts(await res.json());
  };

  const createPost = async () => {
    if (!text.trim()) return;

    await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        text
      })
    });

    setText("");
    reloadPosts();
  };

  const toggleLike = async postId => {
    const res = await fetch(`${API_BASE}/api/posts/like/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id })
    });

    const updated = await res.json();
    setPosts(posts.map(p => (p._id === updated._id ? updated : p)));
  };

  const addComment = async postId => {
    if (!commentText[postId]) return;

    const res = await fetch(`${API_BASE}/api/posts/comment/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        text: commentText[postId]
      })
    });

    const updated = await res.json();
    setPosts(posts.map(p => (p._id === updated._id ? updated : p)));
    setCommentText({ ...commentText, [postId]: "" });
  };

  if (!user) return <div style={{ padding: 20 }}>Please log in</div>;

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

      {posts.map(post => {
        const likes = post.likes || [];
        const comments = post.comments || [];

        return (
          <div className="post" key={post._id}>
            <div className="post-header">
              <img src={avatarUrl(post.name, post.avatar)} alt="" />
              <div>
                <div className="post-name">{post.name}</div>
                <div className="post-time">{post.time}</div>
              </div>
            </div>

            <div className="post-text">{post.text}</div>

            {post.image && (
              <img
                src={`${API_BASE}${post.image}`}
                className="post-image"
                onClick={() => setSelectedImage(`${API_BASE}${post.image}`)}
                alt=""
              />
            )}

            <div className="post-actions">
              <button onClick={() => toggleLike(post._id)}>
                {likes.includes(user._id) ? "❤️" : "🤍"} {likes.length}
              </button>
            </div>

            <div className="comments">
              {comments.map((c, i) => (
                <div key={i} className="comment">
                  <strong>{c.userId === user._id ? "You" : "User"}:</strong> {c.text}
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
        );
      })}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
