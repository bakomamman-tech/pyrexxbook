const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
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
  socket.on("join", userId => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async ({ conversationId, senderId, receiverId, text }) => {
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
  avatar: String,
  cover: String,
  bio: String,
  joined: String,
  followers: [String],
  following: [String],
  friendRequests: [String]   // 🔥 NEW
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  userId: String,
  name: String,
  username: String,
  avatar: String,
  text: String,
  time: String,
  likes: [String],
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

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username: name.toLowerCase().replace(/\s+/g, ""),
    email,
    password: hashed,
    avatar: "/uploads/default.png",
    cover: "/uploads/cover-default.jpg",
    joined: new Date().toISOString().split("T")[0],
    followers: [],
    following: [],
    friendRequests: []
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

  const toUser = await User.findById(toId);
  if (!toUser.friendRequests.includes(fromId)) {
    toUser.friendRequests.push(fromId);
    await toUser.save();
  }

  res.json({ success: true });
});

app.post("/api/friends/accept", async (req, res) => {
  const { userId, requesterId } = req.body;

  const user = await User.findById(userId);
  const requester = await User.findById(requesterId);

  user.friendRequests = user.friendRequests.filter(id => id !== requesterId);

  user.followers.push(requesterId);
  user.following.push(requesterId);

  requester.followers.push(userId);
  requester.following.push(userId);

  await user.save();
  await requester.save();

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

  if (!convo) convo = await Conversation.create({ members: [senderId, receiverId] });

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
