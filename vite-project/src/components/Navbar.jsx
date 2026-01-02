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

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="navbar">

      {/* LEFT */}
      <div className="nav-left">
        <div className="brand" onClick={() => navigate("/")}>
          <img
            src="/pyrexxbook.png"
            alt="PyrexxBook Logo"
            className="brand-logo"
          />
          <span>PyrexxBook</span>
        </div>

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
          onClick={() => navigate(`/profile/${user?.username || ""}`)}
        >
          <img
            src={
              user?.avatar
                ? `https://pyrexxbook-kurah-backend.onrender.com${user.avatar}`
                : "https://pyrexxbook-kurah-backend.onrender.com/uploads/default.png"
            }
            alt="profile"
          />
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logout}
          style={{
            marginLeft: "10px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: "#ff3b3b",
            color: "white",
            fontWeight: "bold"
          }}
        >
          Logout
        </button>
      </div>

    </div>
  );
}

export default Navbar;
