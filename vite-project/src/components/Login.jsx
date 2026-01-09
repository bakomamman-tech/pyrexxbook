import { useState } from "react";
import API_BASE from "../utils/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.user || !data.user._id) {
        throw new Error("Invalid login response");
      }

      // Save user
      localStorage.setItem("user", JSON.stringify(data.user));

      // Hard redirect so socket + feed reinitialize cleanly
      window.location.href = "/";

    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <span
            className="password-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button onClick={submit} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <p
          className="toggle"
          onClick={() => (window.location.href = "/register")}
        >
          Don't have an account? Create one
        </p>
      </div>
    </div>
  );
}
