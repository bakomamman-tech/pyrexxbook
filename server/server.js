const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();

/* ================= CORS ================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://pyrexxbook-kurah.onrender.com", // frontend
      "https://pyrexxbook-kurah-backend.onrender.com" // backend safety
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

/* ================= PATHS ================= */

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

/* ================= MONGODB ================= */

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ================= MODELS ================= */

const User = mongoose.model(
  "User",
  new mongoose.Schema({
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
  })
);

const Post = mongoose.model(
  "Post",
  new mongoose.Schema({
    userId: String,
    name: String,
    username: String,
    avatar: String,
    text: String,
    image: String,
    time: String,
    likes: [String],
    comments: [{ userId: String, text: String, time: String }]
  })
);

const Story = mongoose.model(
  "Story",
  new mongoose.Schema({
    userId: String,
    name: String,
    avatar: String,
    image: String,
    createdAt: { type: Date, default: Date.now }
  })
);

const Conversation = mongoose.model(
  "Conversation",
  new mongoose.Schema({
    members: [String],
    lastMessage: String,
    updatedAt: { type: Date, default: Date.now }
  })
);

const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    conversationId: String,
    senderId: String,
    text: String,
    time: String
  })
);

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.trim().toLowerCase();

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const username = name.toLowerCase().replace(/\s+/g, "");

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

    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ user });
  } catch {
    res.status(500).json({ message: "Server error" });
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

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
  } catch {
    res.status(500).json({ message: "Post failed" });
  }
});

/* ❤️ LIKE */

app.post("/api/posts/like/:postId", async (req, res) => {
  const post = await Post.findById(req.params.postId);
  const { userId } = req.body;

  const index = post.likes.indexOf(userId);
  index === -1 ? post.likes.push(userId) : post.likes.splice(index, 1);

  await post.save();
  res.json(post);
});

/* 💬 COMMENT */

app.post("/api/posts/comment/:postId", async (req, res) => {
  const post = await Post.findById(req.params.postId);

  post.comments.push({
    userId: req.body.userId,
    text: req.body.text,
    time: new Date().toLocaleString()
  });

  await post.save();
  res.json(post);
});

/* 👥 FOLLOW */

app.post("/api/users/follow/:targetId", async (req, res) => {
  const user = await User.findById(req.body.userId);
  const target = await User.findById(req.params.targetId);

  const i = user.following.indexOf(target._id.toString());

  if (i === -1) {
    user.following.push(target._id);
    target.followers.push(user._id);
  } else {
    user.following.splice(i, 1);
    target.followers = target.followers.filter(id => id !== user._id.toString());
  }

  await user.save();
  await target.save();
  res.json({ following: user.following, followers: target.followers });
});

/* ================= MESSENGER ================= */

app.post("/api/conversations", async (req, res) => {
  let convo = await Conversation.findOne({
    members: { $all: [req.body.senderId, req.body.receiverId] }
  });

  if (!convo)
    convo = await Conversation.create({
      members: [req.body.senderId, req.body.receiverId],
      lastMessage: ""
    });

  res.json(convo);
});

app.get("/api/conversations/:userId", async (req, res) => {
  const convos = await Conversation.find({
    members: req.params.userId
  }).sort({ updatedAt: -1 });
  res.json(convos);
});

app.get("/api/messages/:conversationId", async (req, res) => {
  res.json(await Message.find({ conversationId: req.params.conversationId }));
});

app.post("/api/messages", async (req, res) => {
  const msg = await Message.create({
    conversationId: req.body.conversationId,
    senderId: req.body.senderId,
    text: req.body.text,
    time: new Date().toLocaleString()
  });

  await Conversation.findByIdAndUpdate(req.body.conversationId, {
    lastMessage: req.body.text,
    updatedAt: new Date()
  });

  res.json(msg);
});

/* ================= SERVER ================= */

app.listen(process.env.PORT || 10000, () =>
  console.log("Server running on port 10000")
);
