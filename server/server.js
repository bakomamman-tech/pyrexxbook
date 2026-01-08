const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= PATHS ================= */

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

console.log("Uploads:", UPLOADS_PATH);

/* ================= MONGODB ================= */

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ================= MODELS ================= */

const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  avatar: String,
  cover: String,
  bio: String,
  joined: String,
  followers: [String],
  following: [String]
});

const PostSchema = new mongoose.Schema({
  userId: String,
  name: String,
  username: String,
  avatar: String,
  text: String,
  image: String,
  time: String,
  likes: [String],
  comments: [
    {
      userId: String,
      text: String,
      time: String
    }
  ]
});

const StorySchema = new mongoose.Schema({
  userId: String,
  name: String,
  avatar: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);
const Story = mongoose.model("Story", StorySchema);

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: UPLOADS_PATH,
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    email = email.trim().toLowerCase();

    // Enforce real email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ success: false, message: "Enter a valid email address" });
    }

    const username = name.toLowerCase().replace(/\s+/g, "");

    const exists = await User.findOne({
      email: new RegExp("^" + email + "$", "i")
    });

    if (exists) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      avatar: "/uploads/default.png",
      cover: "/uploads/cover-default.jpg",
      bio: "",
      joined: new Date().toISOString().split("T")[0],
      followers: [],
      following: []
    });

    res.json({ success: true, user });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: new RegExp("^" + email + "$", "i") },
        { username: new RegExp("^" + email + "$", "i") }
      ]
    });

    if (!user)
      return res.json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Invalid credentials" });

    res.json({ success: true, user });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= POSTS ================= */

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

app.post("/api/posts", async (req, res) => {
  try {
    const { email, text } = req.body;

    const user = await User.findOne({
      email: new RegExp("^" + email + "$", "i")
    });

    if (!user) return res.json({ success: false, message: "User not found" });

    const post = await Post.create({
      userId: user._id.toString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      text,
      time: new Date().toLocaleString(),
      likes: [],
      comments: []
    });

    res.json(post);
  } catch (e) {
    res.status(500).json({ message: "Post failed" });
  }
});

/* ================= STORIES ================= */

app.post("/api/stories/upload", upload.single("image"), async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  const story = await Story.create({
    userId: user._id.toString(),
    name: user.name,
    avatar: user.avatar,
    image: "/uploads/" + req.file.filename
  });

  res.json(story);
});

app.get("/api/stories/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.json([]);

  const ids = [user._id.toString(), ...user.following];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stories = await Story.find({
    userId: { $in: ids },
    createdAt: { $gte: yesterday }
  }).sort({ createdAt: -1 });

  res.json(stories);
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
