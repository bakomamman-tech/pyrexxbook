import { useNavigate } from "react-router-dom";
import {
  authFetch,
  avatarUrl,
  clearSession
} from "../utils/api";
import "./Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Session clearing should still proceed even if server logout fails.
    } finally {
      clearSession();
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="navbar">
      <button type="button" className="brand" onClick={() => navigate("/")}>
        <img src="/pyrexxbook.png" alt="PyrexxBook" className="brand-logo" />
        <span>PyrexxBook</span>
      </button>

      <div className="nav-search-wrap">
        <input
          className="nav-search"
          placeholder="Search posts, friends, and stories..."
          aria-label="Search"
        />
      </div>

      <div className="nav-right">
        <button
          type="button"
          className="nav-chip"
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <div className="user-pill">
          <img src={avatarUrl(user)} alt={user?.name || "User"} />
          <div>
            <p>{user?.name}</p>
            <small>@{user?.username}</small>
          </div>
        </div>

        <button type="button" className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
