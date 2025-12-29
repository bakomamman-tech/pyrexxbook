import { useEffect } from "react";
import Feed from "./Feed";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

function App() {
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify({
      id: 1766827598510,
      name: "Stephen Daniel Mamman",
      email: "stephen@pyrexx.com",
      avatar: "/uploads/1766849449182.jpg"
    }));
  }, []);

  return (
    <>
      <Navbar />
      <div style={{
        display: "grid",
        gridTemplateColumns: "250px 1fr 300px",
        background: "#f0f2f5",
        minHeight: "100vh"
      }}>
        <Sidebar />
        <Feed />
        <div />
      </div>
    </>
  );
}

export default App;
