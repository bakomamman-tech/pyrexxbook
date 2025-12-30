import { Outlet } from "react-router-dom";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

function App() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          background: "#f0f2f5",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflowX: "hidden"
        }}
      >
        <Sidebar />

        {/* Router renders Feed OR Profile here */}
        <Outlet />
      </div>
    </>
  );
}

export default App;
