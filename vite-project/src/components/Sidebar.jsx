import "./Sidebar.css";
import { Link } from "react-router-dom";

function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="sidebar">
      {/* Profile Card */}
      <Link to={`/profile/${user.username}`} className="profile-link">
        <div className="sidebar-profile">
          <img
            src={`https://pyrexxbook-backend.onrender.com${user.avatar}`}
            alt=""
          />
          <span>{user.name}</span>
        </div>
      </Link>

      <div className="sidebar-menu">
        <p>🤖 Meta AI</p>
        <p>👥 Friends</p>
        <p>📊 Professional dashboard</p>
        <p>🕒 Memories</p>
        <p>💾 Saved</p>
        <p>👪 Groups</p>
        <p>➕ See more</p>
      </div>
    </div>
  );
}

export default Sidebar;
