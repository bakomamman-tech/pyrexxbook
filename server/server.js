const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const http = require("http");

const app = express();              // ✅ app created first
const server = http.createServer(app);

// ✅ routes AFTER app is created
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

/* ================= HELPERS ================= */

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "fallback_access_secret_do_not_use";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret_do_not_use";

// ✅ Access Token: short time (security)
function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

// ✅ Refresh Token: longer time (for re-login without password)
function signRefreshToken(user) {
  return jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

// ✅ Return safe user object (no password)
function safeUser(userDoc) {
  const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
  if (!user) return user;

  delete user.password;
  return user;
}

// ✅ JWT middleware (protect routes using Access Token)
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) return res.status(401).json({ message: "No access token" });

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/expired access token" });
  }
}

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", CLIENT_URL],
    credentials: true
  }
});

// Online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // ✅ Join user system (online tracking + lastSeen)
  socket.on("join", async (userId) => {
    try {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null
      }).catch(() => {});

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      io.emit("onlineUsersMeta", await getOnlineMeta());
    } catch (err) {
      console.log("❌ join error:", err.message);
    }
  });

  // ✅ Join conversation room
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
  });

  /* ✅ Typing feature */
  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("typing", { conversationId, userId });
  });

  socket.on("stopTyping", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("stopTyping", { conversationId, userId });
  });

  /* ✅ Send message: SENT -> DELIVERED (if receiver online) */
  socket.on("sendMessage", async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;
      if (!conversationId || !senderId || !receiverId || !text) return;

      let status = "sent";
      let deliveredAt = null;

      // ✅ if receiver is online => delivered immediately
      if (onlineUsers.has(receiverId)) {
        status = "delivered";
        deliveredAt = new Date();
      }

      const msg = await Message.create({
        conversationId,
        senderId,
        receiverId,
        text,
        time: new Date().toLocaleString(),
        status,
        deliveredAt
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        updatedAt: new Date()
      });

      // ✅ Send in room
      io.to(conversationId).emit("newMessage", msg);

      // ✅ Direct notify receiver if online
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("newMessage", msg);
      }
    } catch (err) {
      console.log("❌ sendMessage error:", err.message);
    }
  });

  /* ✅ DELIVERED ACK */
  socket.on("messageDelivered", async ({ messageId, conversationId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // ✅ If already seen, do nothing
      if (msg.status === "seen") return;

      // ✅ Update to delivered only if not delivered yet
      if (msg.status !== "delivered") {
        msg.status = "delivered";
        msg.deliveredAt = msg.deliveredAt || new Date();
        await msg.save();

        io.to(conversationId).emit("messageStatusUpdated", {
          messageId,
          status: "delivered",
          deliveredAt: msg.deliveredAt
        });
      }
    } catch (err) {
      console.log("❌ messageDelivered error:", err.message);
    }
  });

  /* ✅ SEEN ACK */
  socket.on("messageSeen", async ({ messageId, conversationId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (msg.status !== "seen") {
        // ✅ Ensure deliveredAt exists too (optional but correct)
        if (!msg.deliveredAt) msg.deliveredAt = new Date();

        msg.status = "seen";
        msg.seenAt = new Date();
        await msg.save();

        io.to(conversationId).emit("messageStatusUpdated", {
          messageId,
          status: "seen",
          seenAt: msg.seenAt
        });
      }
    } catch (err) {
      console.log("❌ messageSeen error:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        }).catch(() => {});
      }

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      io.emit("onlineUsersMeta", await getOnlineMeta());

      console.log("❌ Socket disconnected:", socket.id);
    } catch (err) {
      console.log("❌ disconnect error:", err.message);
    }
  });
});

/* ✅ helper for online users meta */
async function getOnlineMeta() {
  const users = await User.find({})
    .select("_id isOnline lastSeen username name avatar")
    .lean();

  return users.map((u) => ({
    userId: String(u._id),
    isOnline: !!u.isOnline,
    lastSeen: u.lastSeen,
    username: u.username,
    name: u.name,
    avatar: u.avatar
  }));
}
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= CORS ================= */

const allowedOrigins = new Set(["http://localhost:5173", CLIENT_URL]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true
  })
);

app.use(express.json());

/* ================= STATIC: UPLOADS ================= */

const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

/* ================= DATABASE ================= */

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err.message));

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: UPLOADS_PATH,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* ================= MODELS ================= */

const UserSchema = new mongoose.Schema(
  {
    name: String,
    username: { type: String, unique: true, index: true },
    email: { type: String, unique: true, index: true },
    password: String,
    avatar: String,
    cover: String,
    bio: String,
    joined: String,
    followers: [String],
    following: [String],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    refreshToken: { type: String, default: null }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

const Post = mongoose.model(
  "Post",
  new mongoose.Schema(
    {
      userId: String,
      name: String,
      username: String,
      avatar: String,
      text: String,
      time: String,
      likes: [String],
      comments: [{ userId: String, text: String, time: String }]
    },
    { timestamps: true }
  )
);

const StorySchema = new mongoose.Schema({
  userId: String,
  name: String,
  avatar: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  seenBy: [
    {
      userId: String,
      name: String,
      time: String
    }
  ]
});

StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Story = mongoose.model("Story", StorySchema);

const Conversation = mongoose.model(
  "Conversation",
  new mongoose.Schema(
    {
      members: [String],
      lastMessage: String,
      updatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
  )
);

const Message = mongoose.model(
  "Message",
  new mongoose.Schema(
    {
      conversationId: String,
      senderId: String,
      receiverId: String,
      text: String,
      time: String,
      status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent"
      },
      deliveredAt: { type: Date, default: null },
      seenAt: { type: Date, default: null }
    },
    { timestamps: true }
  )
);
const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", OtpSchema);

/* ================= HEALTH ================= */

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "pyrexxbook", time: new Date().toISOString() });
});

/* ================= AUTH ================= */

async function generateUniqueUsername(name) {
  let base = name.toLowerCase().replace(/\s+/g, "");
  if (!base) base = "user";

  let username = base;
  let count = 0;

  while (await User.findOne({ username })) {
    count++;
    username = `${base}${count}`;
  }

  return username;
}
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // ✅ Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const otpHash = await bcrypt.hash(otp, 10);

    // ✅ Save/replace OTP
    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
    });

    // ✅ Send Email
    await transporter.sendMail({
      from: `"PyrexxBook" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your PyrexxBook OTP Code",
      html: `
        <h2>PyrexxBook Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.log("❌ OTP send error:", err.message);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
});
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ message: "OTP expired or invalid" });

    if (record.expiresAt < new Date()) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    const ok = await bcrypt.compare(String(otp), record.otpHash);
    if (!ok) return res.status(400).json({ message: "Wrong OTP" });

    // ✅ clear OTP after success
    await OTP.deleteMany({ email });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
});

/* ✅ Register */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const username = await generateUniqueUsername(name);

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

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

/* ✅ Login */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

/* ✅ Refresh Token -> New Access Token */
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = signAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Refresh token expired/invalid" });
  }
});

/* ✅ Logout -> clear refresh token */
app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

/* ✅ Me (protected) */
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user: safeUser(user) });
});

/* ================= USERS (ONLINE + LAST SEEN API) ================= */

app.get("/api/users/online-meta", authMiddleware, async (req, res) => {
  const meta = await getOnlineMeta();
  res.json(meta);
});

/* ================= POSTS ================= */

app.get("/api/posts", async (req, res) => {
  res.json(await Post.find().sort({ _id: -1 }));
});

app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Post text is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = await Post.create({
      userId: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      text,
      time: new Date().toLocaleString(),
      likes: [],
      comments: []
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

/* ================= STORIES ================= */

app.post(
  "/api/stories",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "Image is required" });

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const story = await Story.create({
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        image: "/uploads/" + req.file.filename,
        seenBy: []
      });

      res.json(story);
    } catch (err) {
      res.status(500).json({ message: "Story upload failed" });
    }
  }
);

app.get("/api/stories", async (req, res) => {
  const stories = await Story.find().sort({ createdAt: -1 });
  res.json(stories);
});

app.post("/api/stories/:id/seen", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    if (!story.seenBy.some((v) => v.userId === String(user._id))) {
      story.seenBy.push({
        userId: user._id,
        name: user.name,
        time: new Date().toLocaleString()
      });
      await story.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark seen" });
  }
});

/* ================= MESSENGER ================= */

app.post("/api/conversations", authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    const senderId = req.user.id;

    let convo = await Conversation.findOne({
      members: { $all: [senderId, receiverId] }
    });

    if (!convo) {
      convo = await Conversation.create({
        members: [senderId, receiverId]
      });
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

app.get("/api/conversations/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const convos = await Conversation.find({ members: req.params.userId }).sort({
      updatedAt: -1
    });

    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

app.get("/api/messages/:conversationId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

/* ================= FRONTEND (MONOLITHIC SERVE) ✅ ================= */

const FRONTEND_DIST = path.join(__dirname, "public", "dist");
const indexHtmlPath = path.join(FRONTEND_DIST, "index.html");

app.use("/", express.static(FRONTEND_DIST));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  if (req.path.startsWith("/uploads")) {
    return res.status(404).send("Not found");
  }

  if (!fs.existsSync(indexHtmlPath)) {
    return res
      .status(500)
      .send("Frontend build not found. Run build to generate dist.");
  }

  res.sendFile(indexHtmlPath);
});

/* ================= START ================= */

server.listen(process.env.PORT || 10000, () => {
  console.log("🔥 PyrexxBook REAL-TIME server running");
});
