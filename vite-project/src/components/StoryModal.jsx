import "./StoryModal.css";
import { API } from "../utils/api";

function StoryModal({ stories, storyIndex, setShowStory }) {
  const story = stories[storyIndex];

  if (!story) return null;

  const imageUrl =
    story.image && story.image !== "null" && story.image !== "undefined"
      ? story.image.startsWith("http")
        ? story.image
        : `${API}/${story.image}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          story.name || "User"
        )}&background=1877f2&color=fff`;

  return (
    <div className="story-modal">
      <div className="story-content">
        <img
          src={imageUrl}
          alt={story.name}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              story.name || "User"
            )}&background=1877f2&color=fff`;
          }}
        />
        <h3>{story.name}</h3>
        <button onClick={() => setShowStory(false)}>✕</button>
      </div>
    </div>
  );
}

export default StoryModal;
