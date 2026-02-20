import { useEffect, useMemo, useState } from "react";
import Messenger from "./components/Messenger";
import StoryBar from "./components/StoryBar";
import { apiFetch, authFetch, avatarUrl } from "./utils/api";
import "./Feed.css";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [messengerOpen, setMessengerOpen] = useState(false);

  const totalEngagement = useMemo(
    () =>
      posts.reduce(
        (acc, post) => acc + (post.likes?.length || 0) + (post.comments?.length || 0),
        0
      ),
    [posts]
  );

  const loadPosts = async () => {
    try {
      setError("");
      const data = await apiFetch("/api/posts");
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || posting) return;

    setPosting(true);
    try {
      const created = await authFetch("/api/posts", {
        method: "POST",
        body: { text: content }
      });

      setPosts((prev) => [created, ...prev]);
      setText("");
    } catch (err) {
      setError(err.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const updatePost = (nextPost) => {
    setPosts((prev) => prev.map((post) => (post._id === nextPost._id ? nextPost : post)));
  };

  const toggleLike = async (postId) => {
    try {
      const nextPost = await authFetch(`/api/posts/like/${postId}`, {
        method: "POST"
      });
      updatePost(nextPost);
    } catch (err) {
      setError(err.message || "Failed to update like");
    }
  };

  const addComment = async (postId) => {
    const value = (commentText[postId] || "").trim();
    if (!value) return;

    try {
      const nextPost = await authFetch(`/api/posts/comment/${postId}`, {
        method: "POST",
        body: { text: value }
      });
      updatePost(nextPost);
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="feed">
      <section className="feed-hero">
        <div>
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p>Share updates that matter and build meaningful conversations.</p>
        </div>
        <div className="feed-metrics">
          <strong>{posts.length}</strong>
          <span>Posts in feed</span>
          <strong>{totalEngagement}</strong>
          <span>Total engagement</span>
        </div>
      </section>

      <StoryBar user={user} />

      <form className="composer" onSubmit={createPost}>
        <img src={avatarUrl(user)} alt={user.name} />
        <textarea
          placeholder={`What's your update, ${user.name.split(" ")[0]}?`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1500}
        />
        <button type="submit" disabled={posting}>
          {posting ? "Publishing..." : "Publish"}
        </button>
      </form>

      {error && <p className="feed-error">{error}</p>}

      {loading ? (
        <p className="feed-empty">Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="feed-empty">No posts yet. Be the first to publish.</p>
      ) : (
        posts.map((post) => {
          const liked = post.likes?.includes(user._id);
          return (
            <article className="post" key={post._id}>
              <header className="post-header">
                <img src={avatarUrl(post)} alt={post.name} />
                <div>
                  <strong>{post.name}</strong>
                  <p>@{post.username}</p>
                  <time>{formatTime(post.time || post.createdAt)}</time>
                </div>
              </header>

              <p className="post-text">{post.text}</p>

              <div className="post-actions">
                <button type="button" onClick={() => toggleLike(post._id)}>
                  {liked ? "Unlike" : "Like"} · {post.likes?.length || 0}
                </button>
                <span>{post.comments?.length || 0} comments</span>
              </div>

              <div className="comments">
                {post.comments?.map((comment, index) => (
                  <div className="comment" key={`${post._id}-${index}`}>
                    <strong>{comment.name || "User"}</strong>
                    <p>{comment.text}</p>
                    <small>{formatTime(comment.time)}</small>
                  </div>
                ))}

                <div className="comment-box">
                  <input
                    value={commentText[post._id] || ""}
                    placeholder="Write a comment..."
                    onChange={(event) =>
                      setCommentText((prev) => ({
                        ...prev,
                        [post._id]: event.target.value
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addComment(post._id);
                      }
                    }}
                  />
                  <button type="button" onClick={() => addComment(post._id)}>
                    Reply
                  </button>
                </div>
              </div>
            </article>
          );
        })
      )}

      <button
        type="button"
        className="messenger-fab"
        onClick={() => setMessengerOpen((prev) => !prev)}
      >
        Chat
      </button>

      {messengerOpen && <Messenger user={user} onClose={() => setMessengerOpen(false)} />}
    </div>
  );
}
