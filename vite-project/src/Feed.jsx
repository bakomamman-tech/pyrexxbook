import { useEffect, useState } from "react";
import ProfileCard from "./components/ProfileCard";
import StoryBar from "./components/StoryBar";
import ImageModal from "./components/ImageModal";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!user) return <div style={{ padding: 20 }}>Please log in</div>;

  const avatarUrl = (name, avatar) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=C3005E&color=fff`;
    }
    if (avatar.startsWith("http")) return avatar;
    return avatar;
  };

  const loadPosts = () => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data || []));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = () => {
    if (!text.trim()) return;

    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        text
      })
    }).then(() => {
      setText("");
      loadPosts();
    });
  };

  return (
    <div className="feed-container">
      <ProfileCard user={user} />

      {/* Facebook-style Stories */}
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

          {post.image && (
            <img
              src={post.image}
              className="post-image"
              onClick={() => setSelectedImage(post.image)}
              alt=""
            />
          )}
        </div>
      ))}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
