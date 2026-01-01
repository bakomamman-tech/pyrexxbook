const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const DB_FILE = path.join(__dirname, "db.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

/* ================= FILE SYSTEM ================= */

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], posts: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ================= USERS ================= */

app.get("/api/users/:username", (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.get("/api/users/id/:id", (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

/* ================= AUTH ================= */

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  const db = readDB();

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }

  const username = name.toLowerCase().replace(/\s+/g, "");

  const user = {
    id: Date.now(),
    name,
    username,
    email,
    password,
    avatar: "/uploads/default.png",
    cover: "/uploads/cover-default.jpg",
    bio: "",
    joined: new Date().toISOString().split("T")[0],
    friends: [],
    requests: []
  };

  db.users.push(user);
  writeDB(db);
  res.json(user);
});

/* ✅ LOGIN WITH EMAIL OR USERNAME */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find(
    u =>
      (u.email === email || u.username === email) &&
      u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ message: "Invalid email/username or password" });
  }

  res.json(user);
});

/* LOGOUT */
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

/* ================= FRIEND REQUESTS ================= */

app.post("/api/friends/request", (req, res) => {
  const { fromUserId, toUserId } = req.body;
  const db = readDB();

  const from = db.users.find(u => u.id == fromUserId);
  const to = db.users.find(u => u.id == toUserId);

  if (!from || !to) return res.status(404).json({ message: "User not found" });

  if (to.requests.includes(fromUserId) || to.friends.includes(fromUserId)) {
    return res.json({ message: "Already requested or friends" });
  }

  to.requests.push(fromUserId);
  writeDB(db);
  res.json({ message: "Request sent" });
});

app.post("/api/friends/accept", (req, res) => {
  const { fromUserId, toUserId } = req.body;
  const db = readDB();

  const from = db.users.find(u => u.id == fromUserId);
  const to = db.users.find(u => u.id == toUserId);

  if (!from || !to) return res.status(404).json({ message: "User not found" });

  to.requests = to.requests.filter(id => id != fromUserId);
  to.friends.push(fromUserId);
  from.friends.push(toUserId);

  writeDB(db);
  res.json({ message: "Friend added" });
});

app.post("/api/friends/decline", (req, res) => {
  const { fromUserId, toUserId } = req.body;
  const db = readDB();

  const to = db.users.find(u => u.id == toUserId);
  if (!to) return res.status(404).json({ message: "User not found" });

  to.requests = to.requests.filter(id => id != fromUserId);
  writeDB(db);
  res.json({ message: "Request removed" });
});

/* ================= POSTS ================= */

app.get("/api/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts || []);
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
