import "./Story.css";
import { API } from "../utils/api";

function Story({ stories, setShowStory, setStoryIndex }) {
  return (
    <div className="stories">
      {stories.map((story, index) => {
        // Determine correct image URL
        const imageUrl =
          story.image && story.image !== "null" && story.image !== "undefined"
            ? story.image.startsWith("http")
              ? story.image
              : `${API}/${story.image}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                story.name || "User"
              )}&background=1877f2&color=fff`;

        return (
          <div
            key={index}
            className="story"
            onClick={() => {
              setStoryIndex(index);
              setShowStory(true);
            }}
          >
            <img
              src={imageUrl}
              alt={story.name}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  story.name || "User"
                )}&background=1877f2&color=fff`;
              }}
            />
            <p>{story.name}</p>
          </div>
        );
      })}
    </div>
  );
}

export default Story;
