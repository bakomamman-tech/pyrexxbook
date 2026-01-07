const API_BASE = import.meta.env.MODE === "development"
  ? "http://localhost:5000"
  : "https://pyrexxbook-kurah-backend.onrender.com";

export default API_BASE;
