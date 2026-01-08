const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000"
    : "https://pyrexxbook-kurah-backend.onrender.com";

export default API_BASE;
