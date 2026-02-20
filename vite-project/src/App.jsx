import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Feed from "./Feed";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Register from "./components/Register";
import { getStoredUser } from "./utils/api";
import "./App.css";

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function GuestRoute({ isLoggedIn, children }) {
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const isLoggedIn = Boolean(user?._id);

  return (
    <div className="app-shell">
      {isLoggedIn && <Navbar user={user} setUser={setUser} />}

      <main className={`app-main ${isLoggedIn ? "is-auth" : "is-guest"}`}>
        {isLoggedIn && <Sidebar user={user} />}

        <section className="app-content">
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute isLoggedIn={isLoggedIn}>
                  <Login setUser={setUser} />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute isLoggedIn={isLoggedIn}>
                  <Register setUser={setUser} />
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Feed user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />}
            />
          </Routes>
        </section>

        {isLoggedIn && (
          <aside className="app-right-rail">
            <h3>Momentum</h3>
            <p>Share one meaningful update today.</p>
            <p>Reply to a post and grow your network quality.</p>
            <p>Keep profile details current for better discoverability.</p>
          </aside>
        )}
      </main>
    </div>
  );
}
