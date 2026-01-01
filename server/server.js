const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

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
      return { users: [], posts: [] };
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw) return { users: [], posts: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB read error:", e);
    return { users: [], posts: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("DB write error:", e);
  }
}

/* ================= USERS ================= */

app.get("/api/users/:username", (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.username === req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users/id/:id", (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= AUTH ================= */

app.post("/api/auth/register", (req, res) => {
  try {
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
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* LOGIN WITH EMAIL OR USERNAME */
app.post("/api/auth/login", (req, res) => {
  try {
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
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* LOGOUT */
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

/* ================= POSTS ================= */

app.get("/api/posts", (req, res) => {
  try {
    const db = readDB();
    res.json(db.posts || []);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
