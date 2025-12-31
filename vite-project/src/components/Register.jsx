import { useState } from "react";
import API_BASE from "../utils/api";

function Register({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const register = () => {
    if (!name || !email || !password) {
      return setError("All fields are required");
    }

    setLoading(true);
    setError("");

    fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          localStorage.setItem("user", JSON.stringify(data));
          onSuccess();
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Registration failed");
        setLoading(false);
      });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2>Create Account</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

        <button onClick={register}>
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p onClick={onClose} style={styles.link}>Cancel</p>
      </div>
    </div>
  );
}

export default Register;

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    background: "white",
    padding: 30,
    borderRadius: 10,
    width: 320,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  link: {
    marginTop: 10,
    textAlign: "center",
    color: "#1877f2",
    cursor: "pointer"
  }
};
