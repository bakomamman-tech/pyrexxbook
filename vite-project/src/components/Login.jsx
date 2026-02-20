import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, storeSession } from "../utils/api";
import "./Login.css";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = await apiFetch("/api/auth/login", {
        method: "POST",
        body: {
          email,
          password
        }
      });

      if (!payload?.user?._id) {
        throw new Error("Unexpected login response");
      }

      storeSession(payload);
      setUser(payload.user);
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-badge">Welcome back</p>
        <h1>Sign in to PyrexxBook</h1>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-link-row">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
