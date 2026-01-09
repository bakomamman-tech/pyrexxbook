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
      "https://pyrexxbook-kurah.onrender.com",
      "https://pyrexxbook-kurah-backend.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async (data) => {
    try {
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
      io.to(socket.id).emit("newMessage", msg);

      // Send to receiver if online
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("newMessage", msg);
      }
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
    console.log("User disconnected:", socket.id);
  });
});

/* ================= CORS ================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://pyrexxbook-kurah.onrender.com",
    "https://pyrexxbook-kurah-backend.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook")
  .then(() => console.log("MongoDB connected"));

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: UPLOADS_PATH,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

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

/* ============ STORIES ============ */

const StorySchema = new mongoose.Schema({
  userId: String,
  name: String,
  avatar: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  seenBy: [{ userId: String, name: String, time: String }]
});

StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Story = mongoose.model("Story", StorySchema);

/* ================= MESSENGER MODELS ================= */

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

/* ================= MESSENGER API ================= */

app.post("/api/conversations", async (req, res) => {
  let convo = await Conversation.findOne({
    members: { $all: [req.body.senderId, req.body.receiverId] }
  });

  if (!convo) {
    convo = await Conversation.create({
      members: [req.body.senderId, req.body.receiverId]
    });
  }

  res.json(convo);
});

app.get("/api/conversations/:userId", async (req, res) => {
  const convos = await Conversation.find({ members: req.params.userId });
  res.json(convos);
});

app.get("/api/messages/:conversationId", async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.conversationId });
  res.json(messages);
});

/* ================= START ================= */

server.listen(process.env.PORT || 10000, () => {
  console.log("🔥 PyrexxBook REAL-TIME server running");
});
