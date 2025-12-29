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

// Ensure folders exist
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

/* ================= AUTH ================= */

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  const db = readDB();

  if (db.users.find(u => u.email === email)) {
    return res.json({ msg: "User already exists" });
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password,
    avatar: "/uploads/default.png"
  };

  db.users.push(user);
  writeDB(db);
  res.json({ msg: "Registered" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const user = db.users.find(
    u =>
      u.email.toLowerCase() === cleanEmail &&
      u.password === cleanPassword
  );

  if (!user) {
    console.log("LOGIN FAILED:", cleanEmail, cleanPassword);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json(user);
});
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
  const { name, avatar, text } = req.body;
  const db = readDB();

  const post = {
    id: Date.now(),
    name,
    avatar,
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
  if (!post) return res.json({ msg: "Post not found" });

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }

  writeDB(db);
  res.json(post.likes);
});

/* ================= AVATAR UPLOAD ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});

const upload = multer({ storage });

app.post("/api/upload", upload.single("image"), (req, res) => {
  const { userId } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id == userId);
  if (!user) return res.json({ msg: "User not found" });

  user.avatar = "/uploads/" + req.file.filename;
  writeDB(db);

  res.json({ avatar: user.avatar });
});

/* ================= START ================= */

app.listen(5000, () => {
  console.log("SERVER RUNNING ON http://localhost:5000");
});
