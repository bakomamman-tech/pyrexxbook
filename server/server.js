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

// Get user by username (for profile pages)
app.get("/api/users/:username", (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.username === req.params.username);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

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
    joined: new Date().toISOString().split("T")[0]
  };

  db.users.push(user);
  writeDB(db);

  res.json(user);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json(user);
});

/* ================= BIO ================= */

app.put("/api/users/bio", (req, res) => {
  const { userId, bio } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id == userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.bio = bio;
  writeDB(db);

  res.json(user);
});

/* ================= POSTS ================= */

app.get("/api/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts || []);
});

app.post("/api/posts", (req, res) => {
  const { userId, text } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id == userId);

  const post = {
    id: Date.now(),
    userId,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    text,
    time: new Date().toLocaleString(),
    likes: [],
    comments: []
  };

  db.posts.unshift(post);
  writeDB(db);

  res.json(post);
});

/* ================= LIKES ================= */

app.post("/api/posts/:id/like", (req, res) => {
  const { userId } = req.body;
  const db = readDB();

  const post = db.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }

  writeDB(db);
  res.json(post.likes);
});

/* ================= AVATAR UPLOAD ================= */

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname))
  })
});

app.post("/api/users/:id/avatar", avatarUpload.single("avatar"), (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id == req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.avatar = "/uploads/" + req.file.filename;

  // Update avatar in all posts
  db.posts.forEach(p => {
    if (p.userId == user.id) {
      p.avatar = user.avatar;
    }
  });

  writeDB(db);
  res.json(user);
});

/* ================= START SERVER ================= */

app.listen(5000, () => {
  console.log("SERVER RUNNING ON PORT 5000");
});
