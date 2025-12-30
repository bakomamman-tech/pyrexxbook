import ProfileCard from "./components/ProfileCard";
import "./components/Feed.css";
import StoryModal from "./components/StoryModal";
import { useEffect, useState } from "react";
import { API } from "../utils/api";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [showStory, setShowStory] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const stories = [
    {
      name: "Your story",
      image: null
    },
    {
      name: "Grace",
      image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
    },
    {
      name: "John",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
    },
    {
      name: "Aisha",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
    }
  ];

  const loadPosts = () => {
    fetch(`${API}/api/posts`)
      .then((res) => res.json())
      .then((data) => setPosts(data || []));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  if (!user) {
    return <div style={{ padding: "20px" }}>Please log in</div>;
  }

  const createPost = () => {
    if (!text.trim()) return;

    fetch(`${API}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name,
        avatar: user.avatar,
        text: text
      })
    }).then(() => {
      setText("");
      loadPosts();
    });
  };

  const likePost = (id) => {
    fetch(`${API}/api/posts/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    }).then(loadPosts);
  };

  const avatarUrl = (name, avatar) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=1877f2&color=fff`;
    }

    if (avatar.startsWith("http")) return avatar;
    return `${API}${avatar}`;
  };

  return (
    <div className="feed-container">
      <ProfileCard />

      {/* STORIES */}
      <div className="stories">
        {stories.map((s, i) => (
          <div
            key={i}
            className="story"
            onClick={() => {
              setStoryIndex(i);
              setShowStory(true);
            }}
          >
            <img
              src={
                i === 0
                  ? avatarUrl(user.name, user.avatar)
                  : s.image || avatarUrl(s.name, null)
              }
              alt={s.name}
            />
            <div className="story-name">{s.name}</div>
          </div>
        ))}
      </div>

      {/* CREATE POST */}
      <div className="create-post">
        <img src={avatarUrl(user.name, user.avatar)} alt={user.name} />
        <textarea
          placeholder={`What's on your mind, ${user.name}?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={createPost}>Post</button>
      </div>

      {/* POSTS */}
      {posts.map((post) => (
        <div className="post" key={post.id}>
          <div className="post-header">
            <img src={avatarUrl(post.name, post.avatar)} alt={post.name} />
            <div>
              <div className="post-name">{post.name}</div>
              <div style={{ fontSize: "12px", color: "gray" }}>
                {post.bio || "No bio yet"}
              </div>
              <div className="post-time">{post.time}</div>
            </div>
          </div>

          <div className="post-text">{post.text}</div>

          <div className="post-actions">
            <button onClick={() => likePost(post.id)}>
              👍 Like ({post.likes.length})
            </button>
            <button>💬 Comment</button>
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
    </div>
  );
}

export default Feed;
