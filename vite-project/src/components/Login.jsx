import { useState } from "react";
import API_BASE from "../utils/api";

function Login() {
  const [loginEmail, setLoginEmail] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid login");

      localStorage.setItem("user", JSON.stringify(data));
      window.location.reload();
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!name || !registerEmail || !password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: registerEmail, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("user", JSON.stringify(data));
      window.location.reload();
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ color: "#1877f2" }}>PyrexxBook</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {mode === "login" && (
          <>
            <input
              placeholder="Email or Username"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={login} style={styles.primaryBtn} disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            <p style={styles.link} onClick={() => setMode("forgot")}>
              Forgot password?
            </p>

            <hr />

            <button onClick={() => setMode("register")} style={styles.greenBtn}>
              Create new account
            </button>
          </>
        )}

        {mode === "register" && (
          <>
            <input
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Email"
              value={registerEmail}
              onChange={e => setRegisterEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={register} style={styles.primaryBtn} disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p style={styles.link} onClick={() => setMode("login")}>
              Already have an account?
            </p>
          </>
        )}

        {mode === "forgot" && (
          <>
            <input
              placeholder="Enter your email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              style={styles.input}
            />

            <button style={styles.primaryBtn}>
              Search
            </button>

            <p style={styles.link} onClick={() => setMode("login")}>
              Back to login
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;

const styles = {
  page: {
    height: "100vh",
    background: "#f0f2f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    background: "white",
    padding: 30,
    borderRadius: 10,
    width: 320,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ddd"
  },
  primaryBtn: {
    width: "100%",
    background: "#1877f2",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer"
  },
  greenBtn: {
    width: "100%",
    background: "#42b72a",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer"
  },
  link: {
    marginTop: 10,
    color: "#1877f2",
    cursor: "pointer"
  }
};
