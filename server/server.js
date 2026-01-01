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

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], posts: [], stories: [] };
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw) return { users: [], posts: [], stories: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB read error:", e);
    return { users: [], posts: [], stories: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("DB write error:", e);
  }
}

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

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

/* ================= COVER UPLOAD ================= */

app.post("/api/users/:id/cover", upload.single("cover"), (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.cover = "/uploads/" + req.file.filename;
  writeDB(db);
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
    password: String(password).trim(),
    avatar: "/uploads/default.png",
    cover: "/uploads/cover-default.jpg",
    bio: "",
    joined: new Date().toISOString().split("T")[0],
    followers: [],
    following: []
  };

  db.users.push(user);
  writeDB(db);
  res.json(user);
});

/* ================= LOGIN ================= */

app.post("/api/auth/login", (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const password = req.body.password;
    const db = readDB();

    const user = db.users.find(
      u => u.email === identifier || u.username === identifier
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid login" });
    }

    if (String(user.password).trim() !== String(password).trim()) {
      return res.status(401).json({ message: "Invalid login" });
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= POSTS ================= */

app.get("/api/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts || []);
});

/* ================= STORY UPLOAD ================= */

app.post("/api/stories/upload", upload.single("image"), (req, res) => {
  const { userId } = req.body;
  const db = readDB();

  const story = {
    id: Date.now(),
    userId: Number(userId),
    image: "/uploads/" + req.file.filename,
    createdAt: Date.now()
  };

  db.stories.push(story);
  writeDB(db);
  res.json(story);
});

/* ================= STORY FETCH (24H EXPIRY) ================= */

app.get("/api/stories/:userId", (req, res) => {
  const db = readDB();
  const now = Date.now();

  // Auto-delete expired stories
  db.stories = db.stories.filter(s => now - s.createdAt < 86400000);
  writeDB(db);

  const user = db.users.find(u => u.id == req.params.userId);
  if (!user) return res.json([]);

  const ids = [user.id, ...user.following];
  res.json(db.stories.filter(s => ids.includes(s.userId)));
});

/* ================= FOLLOW SYSTEM ================= */

app.post("/api/users/:id/follow", (req, res) => {
  const { targetId } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id == req.params.id);
  const target = db.users.find(u => u.id == targetId);

  if (!user || !target) return res.sendStatus(404);

  if (!user.following.includes(targetId)) {
    user.following.push(targetId);
    target.followers.push(user.id);
  }

  writeDB(db);
  res.json({ success: true });
});

app.post("/api/users/:id/unfollow", (req, res) => {
  const { targetId } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id == req.params.id);
  const target = db.users.find(u => u.id == targetId);

  user.following = user.following.filter(i => i != targetId);
  target.followers = target.followers.filter(i => i != user.id);

  writeDB(db);
  res.json({ success: true });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
