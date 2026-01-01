import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="navbar">

      {/* LEFT */}
      <div className="nav-left">
        <h2 className="logo" onClick={() => navigate("/")}>PyrexxBook</h2>
        <input className="search" placeholder="Search PyrexxBook..." />
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <div
          className={`nav-icon ${isActive("/") ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          🏠
        </div>

        <div
          className={`nav-icon ${isActive("/videos") ? "active" : ""}`}
          onClick={() => navigate("/videos")}
        >
          🎥
        </div>

        <div
          className={`nav-icon ${isActive("/groups") ? "active" : ""}`}
          onClick={() => navigate("/groups")}
        >
          👥
        </div>

        <div
          className={`nav-icon ${isActive("/market") ? "active" : ""}`}
          onClick={() => navigate("/market")}
        >
          🛒
        </div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <div className="nav-circle">🔲</div>
        <div className="nav-circle">💬</div>
        <div className="nav-circle">🔔</div>

        <div
          className="profile"
          onClick={() => navigate(`/profile/${user?.username}`)}
        >
          <img
            src={`https://pyrexxbook-backend.onrender.com${user?.avatar || "/uploads/default.png"}`}
            alt="profile"
          />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
