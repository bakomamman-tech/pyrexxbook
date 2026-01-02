const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= MONGODB ================= */

mongoose.connect(process.env.MONGO_URI)
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
  image: String,
  createdAt: Number
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);
const Story = mongoose.model("Story", StorySchema);

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const username = name.toLowerCase().replace(/\s+/g, "");

  const user = await User.create({
    name,
    username,
    email,
    password,
    avatar: "/uploads/default.png",
    cover: "/uploads/cover-default.jpg",
    bio: "",
    joined: new Date().toISOString().split("T")[0],
    followers: [],
    following: []
  });

  res.json(user);
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user || user.password !== password)
    return res.status(401).json({ message: "Invalid login" });

  res.json(user);
});

/* ================= POSTS ================= */

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

app.post("/api/posts", async (req, res) => {
  try {
    const { userId, text } = req.body;

    const user = await User.findOne({ _id: userId });
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Post failed" });
  }
});

/* ================= LIKE ================= */

app.post("/api/posts/:id/like", async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) return res.sendStatus(404);

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.json(post);
});

/* ================= COMMENT ================= */

app.post("/api/posts/:id/comment", async (req, res) => {
  const { userId, text } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) return res.sendStatus(404);

  post.comments.push({
    userId,
    text,
    time: new Date().toLocaleString()
  });

  await post.save();
  res.json(post);
});

/* ================= STORIES ================= */

app.post("/api/stories/upload", upload.single("image"), async (req, res) => {
  const story = await Story.create({
    userId: req.body.userId,
    image: "/uploads/" + req.file.filename,
    createdAt: Date.now()
  });
  res.json(story);
});

app.get("/api/stories/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.json([]);

  const ids = [user._id.toString(), ...user.following];
  const stories = await Story.find({ userId: { $in: ids } });
  res.json(stories);
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on", PORT));
