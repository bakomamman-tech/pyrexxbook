import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="sidebar">
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <p>🏠 Home</p>
      </Link>

      <Link to={`profile/${user.username}`} style={{ textDecoration: "none", color: "inherit" }}>
        <p>👤 Profile</p>
      </Link>

      <p>👥 Friends</p>
      <p>🖼 Photos</p>
      <p>⚙ Settings</p>
    </div>
  );
}

export default Sidebar;
