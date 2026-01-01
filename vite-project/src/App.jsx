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
    <div className="app">
      <Navbar />
      <div className="app-body">
        <Sidebar />

        {/* Feed / Profile */}
        <div className="feed-container">
          <Outlet />
        </div>

        {/* Right Panel */}
        <div className="rightbar">
          <h3>Contacts</h3>
          <p>Grace</p>
          <p>Nomzi</p>
          <p>David</p>
        </div>
      </div>
    </div>
  );

}

export default App;
