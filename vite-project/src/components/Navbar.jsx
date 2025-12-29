function Navbar() {
  return (
    <div style={{
      background: "#1877f2",
      color: "white",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <h2>PyrexxBook</h2>
      <input
        placeholder="Search PyrexxBook..."
        style={{
          padding: "8px",
          width: "200px",
          borderRadius: "20px",
          border: "none"
        }}
      />
    </div>
  );
}

export default Navbar;
