const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://pyrexxbook-kurah.onrender.com"
    ],
    credentials: true
  }
});

// userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When user joins
  socket.on("join", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    console.log("Online:", Array.from(onlineUsers.keys()));

    // Send updated online users to everyone
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // Send message
  socket.on("sendMessage", async (data) => {
    const { conversationId, senderId, receiverId, text } = data;

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

    // Send to sender
    socket.emit("newMessage", msg);

    // Send to receiver if online
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("newMessage", msg);
    }
  });

  // When user disconnects
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      console.log("User offline:", socket.userId);

      // Broadcast updated online list
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

/* ================= CORS ================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://pyrexxbook-kurah.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook")
  .then(() => console.log("MongoDB connected"));

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
  following: [String]
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

const Story = mongoose.model("Story", new mongoose.Schema({
  userId: String,
  name: String,
  avatar: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
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

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const username = name.toLowerCase().replace(/\s+/g, "");

  const user = await User.create({
    name,
    username,
    email,
    password: hashed,
    avatar: "/uploads/default.png",
    cover: "/uploads/cover-default.jpg",
    joined: new Date().toISOString().split("T")[0],
    followers: [],
    following: []
  });

  res.json({ user });
});

app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ user });
});

/* ================= POSTS ================= */

app.get("/api/posts", async (req, res) => {
  res.json(await Post.find().sort({ _id: -1 }));
});

app.post("/api/posts", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

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

/* ================= MESSENGER ================= */

app.post("/api/conversations", async (req, res) => {
  let convo = await Conversation.findOne({
    members: { $all: [req.body.senderId, req.body.receiverId] }
  });

  if (!convo)
    convo = await Conversation.create({
      members: [req.body.senderId, req.body.receiverId]
    });

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
