import { useEffect, useState } from "react";

function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>News Feed</h2>

      {posts.map(post => (
        <div key={post.id} style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={`http://localhost:5000${post.avatar}`}
              alt=""
              width="40"
              height="40"
              style={{ borderRadius: "50%", marginRight: "10px" }}
            />
            <strong>{post.name}</strong>
          </div>

          <p>{post.text}</p>
          <small>{post.time}</small>
        </div>
      ))}
    </div>
  );
}

export default Feed;
