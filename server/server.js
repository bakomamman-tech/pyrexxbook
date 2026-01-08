const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();

/* ================= CORS ================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://pyrexxbook-kurah.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

/* ================= PATHS ================= */

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

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

/* 🔥 MESSENGER MODELS */

const ConversationSchema = new mongoose.Schema({
  members: [String],
  lastMessage: String,
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  conversationId: String,
  senderId: String,
  text: String,
  time: String
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);
const Story = mongoose.model("Story", StorySchema);
const Conversation = mongoose.model("Conversation", ConversationSchema);
const Message = mongoose.model("Message", MessageSchema);

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

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Enter a valid email address" });

    const username = name.toLowerCase().replace(/\s+/g, "");

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

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

    res.json({ user });
  } catch {
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
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const index = post.likes.indexOf(userId);
    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

    await post.save();
    res.json(post);
  } catch {
    res.status(500).json({ message: "Like failed" });
  }
});

/* 💬 COMMENT */

app.post("/api/posts/comment/:postId", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.postId);

    post.comments.push({
      userId,
      text,
      time: new Date().toLocaleString()
    });

    await post.save();
    res.json(post);
  } catch {
    res.status(500).json({ message: "Comment failed" });
  }
});

/* 👥 FOLLOW */

app.post("/api/users/follow/:targetId", async (req, res) => {
  const { userId } = req.body;
  const targetId = req.params.targetId;

  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  const isFollowing = user.following.includes(targetId);

  if (isFollowing) {
    user.following = user.following.filter(id => id !== targetId);
    target.followers = target.followers.filter(id => id !== userId);
  } else {
    user.following.push(targetId);
    target.followers.push(userId);
  }

  await user.save();
  await target.save();

  res.json({ following: user.following, followers: target.followers });
});

/* ================= MESSENGER ================= */

app.post("/api/conversations", async (req, res) => {
  const { senderId, receiverId } = req.body;

  let convo = await Conversation.findOne({
    members: { $all: [senderId, receiverId] }
  });

  if (!convo) {
    convo = await Conversation.create({
      members: [senderId, receiverId],
      lastMessage: ""
    });
  }

  res.json(convo);
});

app.get("/api/conversations/:userId", async (req, res) => {
  const convos = await Conversation.find({
    members: req.params.userId
  }).sort({ updatedAt: -1 });

  res.json(convos);
});

app.get("/api/messages/:conversationId", async (req, res) => {
  const msgs = await Message.find({
    conversationId: req.params.conversationId
  });

  res.json(msgs);
});

app.post("/api/messages", async (req, res) => {
  const { conversationId, senderId, text } = req.body;

  const msg = await Message.create({
    conversationId,
    senderId,
    text,
    time: new Date().toLocaleString()
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    updatedAt: new Date()
  });

  res.json(msg);
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
