const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://pyrexxbook-backend.onrender.com";

export default API_BASE;
