function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div
      style={{
        background: "#1877f2",
        color: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <h2>PyrexxBook</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <input
          placeholder="Search PyrexxBook..."
          style={{
            padding: "8px",
            width: "200px",
            borderRadius: "20px",
            border: "none"
          }}
        />

        {user && (
          <>
            <span>{user.name}</span>
            <button
              onClick={logout}
              style={{
                background: "#e4e6eb",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
