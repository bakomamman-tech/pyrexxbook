import ProfileCard from "./components/ProfileCard";
import "./components/Feed.css";
import Story from "./components/Story";
import StoryModal from "./components/StoryModal";
import ImageModal from "./components/ImageModal";
import { useEffect, useState } from "react";
import API_BASE from "./utils/api";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [stories, setStories] = useState([]);
  const [showStory, setShowStory] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const avatarUrl = (name, avatar) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=C3005E&color=fff`;
    }
    if (avatar.startsWith("http")) return avatar;
    return `${API_BASE}${avatar}`;
  };

  const loadPosts = () => {
    fetch(`${API_BASE}/api/posts`)
      .then(res => res.json())
      .then(data => setPosts(data || []));
  };

  const loadStories = () => {
    fetch(`${API_BASE}/api/stories/${user._id}`)
      .then(res => res.json())
      .then(data => setStories(data || []));
  };

  useEffect(() => {
    loadPosts();
    loadStories();
  }, []);

  if (!user) return <div style={{ padding: "20px" }}>Please log in</div>;

  const createPost = () => {
    if (!text.trim()) return;

    fetch(`${API_BASE}/api/posts`, {
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

  const likePost = id => {
    fetch(`${API_BASE}/api/posts/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id })
    }).then(loadPosts);
  };

  const addComment = (id, text) => {
    if (!text.trim()) return;

    fetch(`${API_BASE}/api/posts/${id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        text
      })
    }).then(loadPosts);
  };

  return (
    <div className="feed-container">

      <ProfileCard user={user} />

      <Story
        stories={stories}
        setStories={setStories}
        setShowStory={setShowStory}
        setStoryIndex={setStoryIndex}
      />

      <div className="create-post">
        <img src={avatarUrl(user.name, user.avatar)} alt={user.name} />
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
            <img src={avatarUrl(post.name, post.avatar)} alt={post.name} />
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
            <button onClick={() => likePost(post._id)}>
              👍 Like ({post.likes?.length || 0})
            </button>
          </div>

          {/* COMMENTS */}
          <div className="comments">
            {(post.comments || []).map((c, i) => (
              <div key={i} className="comment">
                <b>{c.userId === user._id ? "You" : "User"}:</b> {c.text}
              </div>
            ))}

            <input
              className="comment-input"
              placeholder="Write a comment..."
              onKeyDown={e => {
                if (e.key === "Enter") {
                  addComment(post._id, e.target.value);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>
      ))}

      {showStory && (
        <StoryModal
          stories={stories}
          storyIndex={storyIndex}
          setShowStory={setShowStory}
        />
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

export default Feed;
