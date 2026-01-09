import { useEffect, useRef, useState } from "react";
import API_BASE from "../utils/api";
import "./StoryBar.css";

export default function StoryBar({ user }) {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const containerRef = useRef();

  /* ================= LOAD STORIES ================= */
  useEffect(() => {
    fetch(`${API_BASE}/stories`)
      .then(res => res.json())
      .then(setStories)
      .catch(console.error);
  }, []);

  const scrollLeft = () => {
    containerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  /* ================= VIEW STORY ================= */
  const openStory = async (story) => {
    setActiveStory(story);

    await fetch(`${API_BASE}/stories/${story._id}/seen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        name: user.name
      })
    });
  };

  /* ================= UPLOAD STORY ================= */
  const uploadStory = async (file) => {
    const form = new FormData();
    form.append("image", file);
    form.append("userId", user._id);
    form.append("name", user.name);

    await fetch(`${API_BASE}/stories`, {
      method: "POST",
      body: form
    });

    // Reload stories
    const res = await fetch(`${API_BASE}/stories`);
    const data = await res.json();
    setStories(data);
  };

  return (
    <div className="story-wrapper">
      <button className="story-nav left" onClick={scrollLeft}>❮</button>
      <button className="story-nav right" onClick={scrollRight}>❯</button>

      <div className="story-bar" ref={containerRef}>
        {/* ADD STORY */}
        <label className="story-card add-story">
          <input
            type="file"
            hidden
            onChange={(e) => uploadStory(e.target.files[0])}
          />
          <div className="plus">+</div>
          <span>Your Story</span>
        </label>

        {/* STORIES */}
        {stories.map((s) => (
          <div
            className="story-card"
            key={s._id}
            onClick={() => openStory(s)}
          >
            <img src={`${API_BASE.replace("/api","")}${s.image}`} alt="" />
            <span>{s.name}</span>
            <div className="story-views">👁 {s.seenBy?.length || 0}</div>
          </div>
        ))}
      </div>

      {/* VIEWERS (Only for your own story) */}
      {activeStory?.userId === user._id && (
        <div className="viewers">
          <h4>Viewed by</h4>
          {activeStory.seenBy?.map(v => (
            <div key={v.userId}>
              {v.name} — {v.time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
