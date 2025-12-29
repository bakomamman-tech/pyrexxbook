import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data || data.msg === "Invalid credentials") {
      setError("Invalid login");
      return;
    }

    // Save REAL user object
    localStorage.setItem("user", JSON.stringify(data));
    window.location.reload();
  };

  return (
    <div style={{
      height: "100vh",
      background: "#f0f2f5",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "300px"
      }}>
        <h2 style={{ color: "#1877f2" }}>PyrexxBook</h2>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            background: "#1877f2",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "6px"
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default Login;
