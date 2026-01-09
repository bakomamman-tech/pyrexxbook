
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api"
    : "https://pyrexxbook-kurah-backend.onrender.com/api";

export default API_BASE;
