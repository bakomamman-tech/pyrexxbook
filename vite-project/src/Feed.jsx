import ProfileCard from "./components/ProfileCard";


import "./components/Feed.css";
import StoryModal from "./components/StoryModal";
import { useEffect, useState } from "react";

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
      image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe"
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
    fetch("http://localhost:5000/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data || []));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  if (!user) {
    return <div style={{ padding: "20px" }}>Please log in</div>;
  }

  const createPost = () => {
    if (!text.trim()) return;

    fetch("http://localhost:5000/api/posts", {
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
    fetch(`http://localhost:5000/api/posts/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    }).then(loadPosts);
  };

  return (
    <div className="feed-container">
<ProfileCard />

      {/* STORIES */}
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
      {i === 0 ? (
        <img src={`http://localhost:5000${user.avatar}`} />
      ) : (
        <img src={s.image} />
      )}
      <div className="story-name">{s.name}</div>
    </div>
  ))}
</div>


      {/* CREATE POST */}
      <div className="create-post">
        <img src={`http://localhost:5000${user.avatar}`} />
        <textarea
          placeholder={`What's on your mind, ${user.name}?`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button onClick={createPost}>Post</button>
      </div>

      {/* POSTS */}
      {posts.map(post => (
        <div className="post" key={post.id}>
          <div className="post-header">
            <img src={`http://localhost:5000${post.avatar}`} />
            <div>
              <div className="post-name">{post.name}</div>

              {/* BIO */}
              <div style={{ fontSize: "12px", color: "gray" }}>
                {user.bio || "No bio yet"}
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
          index={storyIndex}
          onClose={() => setShowStory(false)}
        />
      )}
    </div>
  );
}

export default Feed;
