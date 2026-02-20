import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, storeSession } from "../utils/api";
import "./Login.css";

export default function Register({ setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = await apiFetch("/api/auth/register", {
        method: "POST",
        body: {
          name,
          email,
          password
        }
      });

      if (!payload?.user?._id) {
        throw new Error("Unexpected registration response");
      }

      storeSession(payload);
      setUser(payload.user);
    } catch (err) {
      setError(err.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-badge">Join now</p>
        <h1>Create your account</h1>

        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          placeholder="Your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <label htmlFor="register-confirm">Confirm password</label>
        <input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="auth-link-row">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
