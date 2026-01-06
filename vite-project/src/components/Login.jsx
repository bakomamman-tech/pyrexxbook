import { useState } from "react";
import API_BASE from "../utils/api";
import "./Login.css";

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    try {
      const url = isRegister
        ? "/api/auth/register"
        : "/api/auth/login";

      const body = isRegister
        ? { name, email, password }
        : { email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>{isRegister ? "Create Account" : "Login"}</h2>

        {isRegister && (
          <input
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        <input
          placeholder="Email or Username"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={submit}>
          {isRegister ? "Create Account" : "Login"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <p
          className="toggle"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Create one"}
        </p>
      </div>
    </div>
  );
}
