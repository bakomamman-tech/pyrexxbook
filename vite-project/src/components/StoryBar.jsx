import { useEffect, useRef, useState } from "react";
import "./StoryBar.css";

export default function StoryBar({ user }) {
  const [stories, setStories] = useState([]);
  const containerRef = useRef();

  useEffect(() => {
    fetch(`/api/stories/${user._id}`)
      .then(res => res.json())
      .then(setStories);
  }, [user._id]);

  const scrollLeft = () => {
    containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
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

              await fetch("/api/stories/upload", {
                method: "POST",
                body: form
              });

              window.location.reload();
            }}
          />
          <div className="plus">+</div>
          <span>Your Story</span>
        </label>

        {/* Friends stories */}
        {stories.map((s, i) => (
          <div className="story-card" key={i}>
            <img src={s.image} alt="" />
            <span>{s.name}</span>
          </div>
        ))}

      </div>
    </div>
  );
}
