const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

/* ================= ALLOWED ORIGINS ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://pyrexxbook.onrender.com"
];

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ================= MODELS ================= */

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  username: String,
  email: { type: String, unique: true },
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

/* ================= API ================= */

app.get("/api/users", async (req, res) => {
  res.json(await User.find().select("-password"));
});

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

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({
      message: "An account with this email already exists"
    });
  }

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

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ user });
});

/* ================= SERVE REACT (LAST) ================= */

const clientPath = path.join(__dirname, "public");
app.use(express.static(clientPath));

// Serve React for non-API routes only
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});


/* ================= START ================= */

server.listen(process.env.PORT || 10000, () => {
  console.log("🔥 PyrexxBook REAL-TIME server running");
});
