import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../utils/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (!data.user || !data.user._id) {
        throw new Error("Invalid server response");
      }

      // Save logged-in user
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to feed
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={register}>
        <h2>Create Account</h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p
          onClick={() => navigate("/login")}
          style={styles.link}
        >
          Already have an account? Log in
        </p>
      </form>
    </div>
  );
}

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
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
  },
  link: {
    marginTop: 10,
    textAlign: "center",
    color: "#1877f2",
    cursor: "pointer"
  }
};
