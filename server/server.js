const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://pyrexxbook-kurah.onrender.com",
      "https://pyrexxbook-kurah-backend.onrender.com"
    ],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

  socket.on("join", userId => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async ({ conversationId, senderId, receiverId, text }) => {
    try {
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

      io.to(socket.id).emit("newMessage", msg);

      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit("newMessage", msg);
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

/* ================= MIDDLEWARE ================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://pyrexxbook-kurah.onrender.com",
    "https://pyrexxbook-kurah-backend.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("PyrexxBook API is running");
});

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ================= MODELS ================= */

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  avatar: { type: String, default: "/uploads/default.png" },
  cover: { type: String, default: "/uploads/cover-default.jpg" },
  bio: String,
  joined: String,
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  friendRequests: { type: [String], default: [] }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  userId: String,
  name: String,
  username: String,
  avatar: String,
  text: String,
  time: String,
  likes: { type: [String], default: [] },
  comments: [{ userId: String, text: String, time: String }]
}));

const Conversation = mongoose.model("Conversation", new mongoose.Schema({
  members: [String],
  lastMessage: String,
  updatedAt: { type: Date, default: Date.now }
}));

const Message = mongoose.model("Message", new mongoose.Schema({
  conversationId: String,
  senderId: String,
  text: String,
  time: String
}));

/* ================= USERS ================= */

app.get("/api/users", async (req, res) => {
  res.json(await User.find().select("-password"));
});

/* ================= POSTS (🔥 FIXED) ================= */

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

app.post("/api/posts", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const post = await Post.create({
    userId: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    text: req.body.text,
    time: new Date().toLocaleString(),
    likes: [],
    comments: []
  });

  res.json(post);
});

app.post("/api/posts/like/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  if (post.likes.includes(req.body.userId)) {
    post.likes = post.likes.filter(id => id !== req.body.userId);
  } else {
    post.likes.push(req.body.userId);
  }

  await post.save();
  res.json(post);
});

app.post("/api/posts/comment/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({
    userId: req.body.userId,
    text: req.body.text,
    time: new Date().toLocaleString()
  });

  await post.save();
  res.json(post);
});

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username: name.toLowerCase().replace(/\s+/g, ""),
    email,
    password: hashed,
    joined: new Date().toISOString().split("T")[0]
  });

  res.json({ user });
});

app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ user });
});

/* ================= FRIEND REQUESTS ================= */

app.post("/api/friends/request", async (req, res) => {
  const { fromId, toId } = req.body;

  const sender = await User.findById(fromId);
  const receiver = await User.findById(toId);

  if (!receiver.friendRequests.includes(fromId)) {
    receiver.friendRequests.push(fromId);
    await receiver.save();
  }

  const socketId = onlineUsers.get(toId);
  if (socketId) {
    io.to(socketId).emit("friendRequest", {
      fromId,
      name: sender.name,
      avatar: sender.avatar
    });
  }

  res.json({ success: true });
});

app.post("/api/friends/accept", async (req, res) => {
  const { userId, requesterId } = req.body;

  const user = await User.findById(userId);
  const requester = await User.findById(requesterId);

  user.friendRequests = user.friendRequests.filter(id => id !== requesterId);

  if (!user.followers.includes(requesterId)) user.followers.push(requesterId);
  if (!user.following.includes(requesterId)) user.following.push(requesterId);
  if (!requester.followers.includes(userId)) requester.followers.push(userId);
  if (!requester.following.includes(userId)) requester.following.push(userId);

  await user.save();
  await requester.save();

  const socketId = onlineUsers.get(requesterId);
  if (socketId) {
    io.to(socketId).emit("friendAccepted", {
      name: user.name
    });
  }

  res.json({ success: true });
});

app.post("/api/friends/reject", async (req, res) => {
  const { userId, requesterId } = req.body;
  const user = await User.findById(userId);

  user.friendRequests = user.friendRequests.filter(id => id !== requesterId);
  await user.save();

  res.json({ success: true });
});

/* ================= MESSENGER (Friends Only) ================= */

app.post("/api/conversations", async (req, res) => {
  const { senderId, receiverId } = req.body;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  const isFriend =
    sender.following.includes(receiverId) &&
    receiver.following.includes(senderId);

  if (!isFriend)
    return res.status(403).json({ message: "Friends only" });

  let convo = await Conversation.findOne({
    members: { $all: [senderId, receiverId] }
  });

  if (!convo) {
    convo = await Conversation.create({ members: [senderId, receiverId] });
  }

  res.json(convo);
});

app.get("/api/conversations/:userId", async (req, res) => {
  res.json(await Conversation.find({ members: req.params.userId }));
});

app.get("/api/messages/:conversationId", async (req, res) => {
  res.json(await Message.find({ conversationId: req.params.conversationId }));
});

/* ================= START ================= */

server.listen(process.env.PORT || 10000, () => {
  console.log("🔥 PyrexxBook REAL-TIME server running");
});
