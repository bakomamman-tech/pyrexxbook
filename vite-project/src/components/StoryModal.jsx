import { useEffect, useState } from "react";
import "./StoryModal.css";

function StoryModal({ stories, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 1;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [current]);

  const next = () => {
    if (current < stories.length - 1) {
      setCurrent(current + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setProgress(0);
    }
  };

  return (
    <div className="story-modal">
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>

      <img src={stories[current].image} className="story-img" />

      <div className="story-name-full">
        {stories[current].name}
      </div>

      <div className="left" onClick={prev}></div>
      <div className="right" onClick={next}></div>
      <button className="close-btn" onClick={onClose}>✕</button>
    </div>
  );
}

export default StoryModal;
