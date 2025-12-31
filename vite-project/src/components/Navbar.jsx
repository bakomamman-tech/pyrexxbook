import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../utils/api";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);

  const loadRequests = () => {
    if (!user) return;
    fetch(`${API_BASE}/api/users/${user.username}`)
      .then(res => res.json())
      .then(data => setRequests(data.requests || []));
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const accept = (fromUserId) => {
    fetch(`${API_BASE}/api/friends/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId: user.id })
    }).then(loadRequests);
  };

  const decline = (fromUserId) => {
    fetch(`${API_BASE}/api/friends/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId: user.id })
    }).then(loadRequests);
  };

  return (
    <div style={{
      background: "#1877f2",
      color: "white",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <Link to="/" style={{ color: "white", textDecoration: "none" }}>
        <h2>PyrexxBook</h2>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

        {/* 🔔 Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{ background: "none", border: "none", color: "white", fontSize: 22, cursor: "pointer" }}
          >
            🔔 {requests.length > 0 && <span>({requests.length})</span>}
          </button>

          {open && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 40,
              background: "white",
              color: "black",
              width: 260,
              borderRadius: 8,
              boxShadow: "0 4px 10px rgba(0,0,0,.2)",
              zIndex: 10
            }}>
              {requests.length === 0 && (
                <p style={{ padding: 10 }}>No friend requests</p>
              )}

              {requests.map(id => (
                <FriendRequest
                  key={id}
                  fromUserId={id}
                  accept={accept}
                  decline={decline}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <Link to={`/profile/${user.username}`} style={{ color: "white" }}>
          {user.name}
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#1877f2",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function FriendRequest({ fromUserId, accept, decline }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`https://pyrexxbook-backend.onrender.com/api/users/id/${fromUserId}`)
      .then(res => res.json())
      .then(setUser);
  }, []);

  if (!user) return null;

  return (
    <div style={{ padding: 10, borderBottom: "1px solid #eee" }}>
      <strong>{user.name}</strong>
      <div style={{ marginTop: 5 }}>
        <button onClick={() => accept(user.id)}>Accept</button>
        <button onClick={() => decline(user.id)} style={{ marginLeft: 10 }}>
          Decline
        </button>
      </div>
    </div>
  );
}

export default Navbar;
