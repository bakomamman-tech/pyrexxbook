const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://pyrexxbook.onrender.com/api";

export default API_BASE;
