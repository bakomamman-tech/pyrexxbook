import "./Navbar.css";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <h2 className="logo">PyrexxBook</h2>
        <input className="search" placeholder="Search PyrexxBook..." />
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <span className="nav-icon">🏠</span>
        <span className="nav-icon">🎥</span>
        <span className="nav-icon">👥</span>
        <span className="nav-icon">🛒</span>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <span className="nav-icon">💬</span>
        <span className="nav-icon">🔔</span>

        <div className="profile">
          <img
            src={`https://pyrexxbook-backend.onrender.com${user?.avatar}`}
            alt=""
          />
          <span>{user?.name}</span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
