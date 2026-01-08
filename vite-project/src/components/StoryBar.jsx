import { useEffect, useRef, useState } from "react";
import "./StoryBar.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function StoryBar({ user }) {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    fetch(`${API_BASE}/api/stories`)
      .then(res => res.json())
      .then(setStories);
  }, []);

  const scrollLeft = () => {
    containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  const openStory = async (story) => {
    setActiveStory(story);

    await fetch(`${API_BASE}/api/stories/${story._id}/seen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        name: user.name
      })
    });
  };

  return (
    <div className="story-wrapper">
      <button className="story-nav left" onClick={scrollLeft}>❮</button>
      <button className="story-nav right" onClick={scrollRight}>❯</button>

      <div className="story-bar" ref={containerRef}>
        {/* Your story */}
        <label className="story-card add-story">
          <input
            type="file"
            hidden
            onChange={async e => {
              const form = new FormData();
              form.append("image", e.target.files[0]);
              form.append("userId", user._id);

              await fetch(`${API_BASE}/api/stories`, {
                method: "POST",
                body: form
              });

              window.location.reload();
            }}
          />
          <div className="plus">+</div>
          <span>Your Story</span>
        </label>

        {/* Stories */}
        {stories.map((s, i) => (
          <div
            className="story-card"
            key={i}
            onClick={() => openStory(s)}
          >
            <img src={`${API_BASE}${s.image}`} alt="" />
            <span>{s.name}</span>
            <div className="story-views">👁 {s.seenBy?.length || 0}</div>
          </div>
        ))}
      </div>

      {/* Viewer list for your story */}
      {activeStory?.userId === user._id && (
        <div className="viewers">
          <h4>Viewed by</h4>
          {activeStory.seenBy?.map(v => (
            <div key={v.userId}>
              {v.name} – {v.time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
