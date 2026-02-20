import { useEffect, useRef, useState } from "react";
import API_BASE, { apiFetch, authFetch, avatarUrl } from "../utils/api";
import "./StoryBar.css";

function storyImageURL(imagePath) {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return API_BASE ? `${API_BASE}${imagePath}` : imagePath;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function StoryBar({ user }) {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);

  const loadStories = async () => {
    try {
      const payload = await apiFetch("/api/stories");
      setStories(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message || "Failed to load stories");
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const scrollBy = (distance) => {
    containerRef.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  const markSeen = async (story) => {
    try {
      const response = await authFetch(`/api/stories/${story._id}/seen`, {
        method: "POST"
      });

      setStories((prev) =>
        prev.map((item) =>
          item._id === story._id ? { ...item, seenBy: response.seenBy || item.seenBy } : item
        )
      );
    } catch {
      // Do not block viewing when tracking seen fails.
    }
  };

  const openStory = async (story) => {
    setActiveStory(story);
    await markSeen(story);
  };

  const uploadStory = async (event) => {
    const file = event.target.files?.[0];
    if (!file || uploading) return;

    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", file);

      const created = await authFetch("/api/stories", {
        method: "POST",
        body: form
      });

      setStories((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to upload story");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  return (
    <section className="story-wrapper">
      <header className="story-header">
        <h2>Stories</h2>
        <p>Snapshots that disappear in 24 hours.</p>
      </header>

      <button type="button" className="story-nav left" onClick={() => scrollBy(-300)}>
        &#8249;
      </button>
      <button type="button" className="story-nav right" onClick={() => scrollBy(300)}>
        &#8250;
      </button>

      <div className="story-bar" ref={containerRef}>
        <label className="story-card add-story">
          <input type="file" accept="image/*" hidden onChange={uploadStory} />
          <img src={avatarUrl(user)} alt={user.name} className="story-owner-avatar" />
          <div className="plus">{uploading ? "..." : "+"}</div>
          <span>Create story</span>
        </label>

        {stories.map((story) => (
          <button
            type="button"
            className="story-card"
            key={story._id}
            onClick={() => openStory(story)}
          >
            <img src={storyImageURL(story.image)} alt={story.name} />
            <span>{story.name}</span>
            <small>{story.seenBy?.length || 0} views</small>
          </button>
        ))}
      </div>

      {error && <p className="story-error">{error}</p>}

      {activeStory && (
        <div className="story-modal" onClick={() => setActiveStory(null)}>
          <div className="story-modal-card" onClick={(event) => event.stopPropagation()}>
            <img src={storyImageURL(activeStory.image)} alt={activeStory.name} />
            <div className="story-modal-meta">
              <strong>{activeStory.name}</strong>
              <span>{formatTime(activeStory.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
