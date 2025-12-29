function Sidebar() {
  return (
    <div style={{
      width: "200px",
      padding: "15px",
      borderRight: "1px solid #ddd",
      minHeight: "100vh"
    }}>
      <p>🏠 Home</p>
      <p>👤 Profile</p>
      <p>👥 Friends</p>
      <p>🖼 Photos</p>
      <p>⚙ Settings</p>
    </div>
  );
}

export default Sidebar;
