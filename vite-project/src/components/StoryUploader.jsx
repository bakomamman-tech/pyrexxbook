import { useRef } from "react";

function StoryUploader({ onUploaded }) {
  const fileRef = useRef();

  const user = JSON.parse(localStorage.getItem("user"));

  const uploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user.id);

    const res = await fetch(
      "https://pyrexxbook-backend.onrender.com/api/stories/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    onUploaded(data);
  };

  return (
    <div
      onClick={() => fileRef.current.click()}
      style={{
        width: 120,
        height: 200,
        borderRadius: 15,
        background: "#EEE9FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontWeight: "bold",
        color: "#4B2BFF"
      }}
    >
      + Create Story
      <input
        type="file"
        hidden
        ref={fileRef}
        accept="image/*"
        onChange={uploadStory}
      />
    </div>
  );
}

export default StoryUploader;
