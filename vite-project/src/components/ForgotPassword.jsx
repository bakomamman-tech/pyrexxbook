import { useState } from "react";

function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState("");

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2>Find your account</h2>

        <input
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <button onClick={() => alert("Password recovery coming soon")}>
          Search
        </button>

        <p onClick={onClose} style={styles.link}>Cancel</p>
      </div>
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
  link: {
    textAlign: "center",
    color: "#1877f2",
    cursor: "pointer"
  }
};
