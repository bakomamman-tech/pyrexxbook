import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../utils/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store only the user object
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={login}>
        <h2 style={{ color: "#1877f2" }}>PyrexxBook</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button style={styles.primaryBtn}>Log In</button>
      </form>
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
  }
};
