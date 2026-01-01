import "./Story.css";
import { API } from "../utils/api";
import { useRef } from "react";

function Story({ stories, setStories, setShowStory, setStoryIndex }) {
  const fileRef = useRef();
  const user = JSON.parse(localStorage.getItem("user"));

  async function uploadStory(file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user.id);

    const res = await fetch(`${API}/api/stories/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setStories(prev => [data, ...prev]);
  }

  return (
    <div className="stories">

      {/* CREATE STORY */}
      <div className="story create" onClick={() => fileRef.current.click()}>
        <div className="create-box">+</div>
        <p>Create Story</p>
        <input
          type="file"
          hidden
          ref={fileRef}
          accept="image/*"
          onChange={e => uploadStory(e.target.files[0])}
        />
      </div>

      {stories.map((story, index) => {
        const imageUrl =
          story.image && story.image !== "null"
            ? story.image.startsWith("http")
              ? story.image
              : `${API}${story.image}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                story.name || "User"
              )}&background=C3005E&color=fff`;

        return (
          <div
            key={story.id || index}
            className="story"
            onClick={() => {
              setStoryIndex(index);
              setShowStory(true);
            }}
          >
            <img src={imageUrl} alt="story" />
            <p>{story.name || "Story"}</p>
          </div>
        );
      })}
    </div>
  );
}

export default Story;
