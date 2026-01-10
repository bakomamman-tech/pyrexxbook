import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const avatarUrl = user?.avatar
    ? `https://pyrexxbook.onrender.com${user.avatar}`
    : `https://pyrexxbook.onrender.com/uploads/default.png`;

  return (
    <div className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <div className="brand" onClick={() => navigate("/")}>
          <img src="/pyrexxbook.png" alt="PyrexxBook Logo" className="brand-logo" />
          <span>PyrexxBook</span>
        </div>
        <input className="search" placeholder="Search PyrexxBook..." />
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <div className={`nav-icon ${isActive("/") ? "active" : ""}`} onClick={() => navigate("/")}>🏠</div>
        <div className={`nav-icon ${isActive("/videos") ? "active" : ""}`} onClick={() => navigate("/videos")}>🎥</div>
        <div className={`nav-icon ${isActive("/groups") ? "active" : ""}`} onClick={() => navigate("/groups")}>👥</div>
        <div className={`nav-icon ${isActive("/market") ? "active" : ""}`} onClick={() => navigate("/market")}>🛒</div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <div className="nav-circle">🔲</div>
        <div className="nav-circle">💬</div>
        <div className="nav-circle">🔔</div>

        {user ? (
          <>
            <div className="profile" onClick={() => navigate(`/profile/${user.username}`)}>
              <img src={avatarUrl} alt="profile" />
            </div>

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
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/register")}>Create Account</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
