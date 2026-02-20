import { useState } from "react";

function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Enter a valid email address.");
      return;
    }
    setMessage("Password recovery flow is not enabled yet.");
  };

  return (
    <div style={styles.overlay}>
      <form style={styles.card} onSubmit={submit}>
        <h2>Find your account</h2>

        <input
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <button type="submit">Search</button>

        {message && <p style={styles.info}>{message}</p>}

        <p onClick={onClose} style={styles.link}>Cancel</p>
      </form>
    </div>
  );
}

export default ForgotPassword;

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
  info: {
    fontSize: 13,
    color: "#334155"
  },
  link: {
    textAlign: "center",
    color: "#1877f2",
    cursor: "pointer"
  }
};
