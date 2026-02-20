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
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pyrexxbook";
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "development_access_secret_change_me";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "development_refresh_secret_change_me";
const UPLOADS_PATH = path.join(__dirname, "uploads");
const FRONTEND_DIST = path.join(__dirname, "public", "dist");
const INDEX_HTML_PATH = path.join(FRONTEND_DIST, "index.html");
const MAX_POST_LENGTH = 1500;
const MAX_COMMENT_LENGTH = 500;

if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

function nowISO() {
  return new Date().toISOString();
}

function safeUser(userDoc) {
  const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
  if (!user) return null;
  delete user.password;
  delete user.refreshToken;
  return user;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeUsernameSeed(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function buildAllowedOrigins() {
  const set = new Set(["http://localhost:5173", CLIENT_URL]);
  const raw = process.env.CLIENT_URLS || "";
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => set.add(item));
  return set;
}

function signAccessToken(user) {
  return jwt.sign(
    { id: String(user._id), email: user.email, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ id: String(user._id) }, JWT_REFRESH_SECRET, {
    expiresIn: "30d"
  });
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    req.user = jwt.verify(token, JWT_ACCESS_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

if (
  !process.env.JWT_ACCESS_SECRET ||
  !process.env.JWT_REFRESH_SECRET
) {
  console.warn(
    "[security] JWT secrets are using development fallbacks. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET."
  );
}

const allowedOrigins = buildAllowedOrigins();

const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    credentials: true
  }
});

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS rejected for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_PATH));

/* ================= MODELS ================= */

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 24
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "/uploads/default.png" },
    cover: { type: String, default: "/uploads/cover-default.jpg" },
    bio: { type: String, default: "" },
    joined: { type: String, default: () => nowISO().split("T")[0] },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    refreshToken: { type: String, default: null }
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: "/uploads/default.png" },
    text: { type: String, required: true, trim: true, maxlength: MAX_POST_LENGTH },
    time: { type: String, default: nowISO },
    likes: { type: [String], default: [] },
    comments: {
      type: [
        {
          userId: String,
          name: String,
          text: String,
          time: String
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

const StorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "/uploads/default.png" },
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    seenBy: {
      type: [
        {
          userId: String,
          name: String,
          time: String
        }
      ],
      default: []
    }
  },
  { timestamps: false }
);

StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const ConversationSchema = new mongoose.Schema(
  {
    members: { type: [String], required: true, default: [] },
    lastMessage: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ConversationSchema.index({ members: 1 });

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    time: { type: String, default: nowISO },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    deliveredAt: { type: Date, default: null },
    seenAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
const Story = mongoose.models.Story || mongoose.model("Story", StorySchema);
const Conversation =
  mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
const OTP = mongoose.models.OTP || mongoose.model("OTP", OtpSchema);

/* ================= DATABASE ================= */

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[db] MongoDB connected"))
  .catch((err) => console.error("[db] MongoDB connection error:", err.message));

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: UPLOADS_PATH,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!String(file.mimetype || "").startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    return cb(null, true);
  }
});

/* ================= MAILER ================= */

const mailerEnabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = mailerEnabled
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    })
  : null;

/* ================= SOCKET ================= */

const onlineUsers = new Map(); // userId -> Set<socketId>

function addSocketForUser(userId, socketId) {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
}

function removeSocketForUser(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, sockets);
  }
}

function isOnline(userId) {
  return onlineUsers.has(userId);
}

async function getOnlineMeta() {
  const users = await User.find({})
    .select("_id isOnline lastSeen username name avatar")
    .lean();

  return users.map((user) => ({
    userId: String(user._id),
    isOnline: Boolean(user.isOnline),
    lastSeen: user.lastSeen,
    username: user.username,
    name: user.name,
    avatar: user.avatar
  }));
}

async function broadcastOnlineUsers() {
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  io.emit("onlineUsersMeta", await getOnlineMeta());
}

io.on("connection", (socket) => {
  socket.on("join", async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        return;
      }

      socket.userId = String(userId);
      addSocketForUser(socket.userId, socket.id);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: null
      }).catch(() => null);

      await broadcastOnlineUsers();
    } catch (err) {
      console.error("[socket] join error:", err.message);
    }
  });

  socket.on("joinConversation", (conversationId) => {
    if (conversationId) {
      socket.join(String(conversationId));
    }
  });

  socket.on("leaveConversation", (conversationId) => {
    if (conversationId) {
      socket.leave(String(conversationId));
    }
  });

  socket.on("typing", ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;
    socket.to(String(conversationId)).emit("typing", {
      conversationId: String(conversationId),
      userId: String(userId)
    });
  });

  socket.on("stopTyping", ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;
    socket.to(String(conversationId)).emit("stopTyping", {
      conversationId: String(conversationId),
      userId: String(userId)
    });
  });

  socket.on("sendMessage", async (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      const senderId = String(data?.senderId || "");
      const receiverId = String(data?.receiverId || "");
      const text = String(data?.text || "").trim();

      if (!conversationId || !senderId || !receiverId || !text) {
        return;
      }

      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return;

      const members = (conversation.members || []).map(String);
      if (!members.includes(senderId) || !members.includes(receiverId)) {
        return;
      }

      let status = "sent";
      let deliveredAt = null;
      if (isOnline(receiverId)) {
        status = "delivered";
        deliveredAt = new Date();
      }

      const message = await Message.create({
        conversationId,
        senderId,
        receiverId,
        text,
        time: nowISO(),
        status,
        deliveredAt
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        updatedAt: new Date()
      });

      io.to(conversationId).emit("newMessage", message);

      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets?.size) {
        receiverSockets.forEach((receiverSocketId) => {
          io.to(receiverSocketId).emit("newMessage", message);
        });
      }
    } catch (err) {
      console.error("[socket] sendMessage error:", err.message);
    }
  });

  socket.on("messageDelivered", async ({ messageId, conversationId }) => {
    try {
      if (!messageId || !conversationId) return;
      const message = await Message.findById(messageId);
      if (!message || message.status === "seen") return;

      if (message.status !== "delivered") {
        message.status = "delivered";
        message.deliveredAt = message.deliveredAt || new Date();
        await message.save();

        io.to(String(conversationId)).emit("messageStatusUpdated", {
          messageId: String(messageId),
          status: "delivered",
          deliveredAt: message.deliveredAt
        });
      }
    } catch (err) {
      console.error("[socket] messageDelivered error:", err.message);
    }
  });

  socket.on("messageSeen", async ({ messageId, conversationId }) => {
    try {
      if (!messageId || !conversationId) return;
      const message = await Message.findById(messageId);
      if (!message) return;

      if (message.status !== "seen") {
        if (!message.deliveredAt) message.deliveredAt = new Date();
        message.status = "seen";
        message.seenAt = new Date();
        await message.save();

        io.to(String(conversationId)).emit("messageStatusUpdated", {
          messageId: String(messageId),
          status: "seen",
          seenAt: message.seenAt
        });
      }
    } catch (err) {
      console.error("[socket] messageSeen error:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        removeSocketForUser(socket.userId, socket.id);

        if (!isOnline(socket.userId)) {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          }).catch(() => null);
        }
      }

      await broadcastOnlineUsers();
    } catch (err) {
      console.error("[socket] disconnect error:", err.message);
    }
  });
});

/* ================= HEALTH ================= */

app.get("/api/health", (_, res) => {
  res.json({ ok: true, app: "pyrexxbook", time: nowISO() });
});

/* ================= AUTH ================= */

async function generateUniqueUsername(name) {
  const base = sanitizeUsernameSeed(name) || "user";
  let username = base;
  let counter = 0;

  while (await User.findOne({ username })) {
    counter += 1;
    username = `${base}${counter}`;
  }

  return username;
}

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    if (!transporter) {
      return res.status(503).json({ message: "Email service is not configured" });
    }

    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await transporter.sendMail({
      from: `"PyrexxBook" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your PyrexxBook OTP Code",
      html: `<h2>Your OTP is: <b>${otp}</b></h2><p>Expires in 5 minutes.</p>`
    });

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!isEmail(email) || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) {
      return res.status(400).json({ message: "Wrong OTP" });
    }

    await OTP.deleteMany({ email });
    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!name || !isEmail(email) || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Name, valid email, and password (min 6 chars) are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const username = await generateUniqueUsername(name);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      joined: nowISO().split("T")[0]
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      user: safeUser(user),
      accessToken,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!isEmail(email) || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      user: safeUser(user),
      accessToken,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

app.post("/api/auth/refresh", async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken || "");
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
});

app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Logout failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
  } catch {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* ================= USERS ================= */

app.get("/api/users", authMiddleware, async (_req, res) => {
  try {
    const users = await User.find({})
      .select("_id name username avatar cover bio followers following isOnline lastSeen")
      .lean();

    return res.json(users.map(safeUser));
  } catch {
    return res.status(500).json({ message: "Failed to load users" });
  }
});

app.get("/api/users/online-meta", authMiddleware, async (_req, res) => {
  try {
    const meta = await getOnlineMeta();
    return res.json(meta);
  } catch {
    return res.status(500).json({ message: "Failed to load online users" });
  }
});

app.post("/api/users/follow/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = String(req.params.id || "");
    const actorId = String(req.user.id || "");

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (targetId === actorId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [actor, target] = await Promise.all([
      User.findById(actorId),
      User.findById(targetId)
    ]);

    if (!actor || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    const actorFollowing = new Set((actor.following || []).map(String));
    const targetFollowers = new Set((target.followers || []).map(String));

    if (actorFollowing.has(targetId)) {
      actorFollowing.delete(targetId);
      targetFollowers.delete(actorId);
    } else {
      actorFollowing.add(targetId);
      targetFollowers.add(actorId);
    }

    actor.following = Array.from(actorFollowing);
    target.followers = Array.from(targetFollowers);

    await Promise.all([actor.save(), target.save()]);

    return res.json({
      following: actor.following,
      followers: target.followers
    });
  } catch {
    return res.status(500).json({ message: "Failed to update follow state" });
  }
});

/* ================= POSTS ================= */

app.get("/api/posts", async (_req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    return res.json(posts);
  } catch {
    return res.status(500).json({ message: "Failed to load posts" });
  }
});

app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Post text is required" });
    }

    if (text.length > MAX_POST_LENGTH) {
      return res
        .status(400)
        .json({ message: `Post text must be ${MAX_POST_LENGTH} characters or fewer` });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.create({
      userId: String(user._id),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      text,
      time: nowISO()
    });

    return res.status(201).json(post);
  } catch {
    return res.status(500).json({ message: "Failed to create post" });
  }
});

app.post("/api/posts/like/:id", authMiddleware, async (req, res) => {
  try {
    const postId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likes = new Set((post.likes || []).map(String));
    const userId = String(req.user.id);

    if (likes.has(userId)) {
      likes.delete(userId);
    } else {
      likes.add(userId);
    }

    post.likes = Array.from(likes);
    await post.save();

    return res.json(post);
  } catch {
    return res.status(500).json({ message: "Failed to toggle like" });
  }
});

app.post("/api/posts/comment/:id", authMiddleware, async (req, res) => {
  try {
    const postId = String(req.params.id || "");
    const text = String(req.body?.text || "").trim();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      return res
        .status(400)
        .json({ message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
    }

    const [post, user] = await Promise.all([
      Post.findById(postId),
      User.findById(req.user.id).select("_id name")
    ]);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    post.comments.push({
      userId: String(user._id),
      name: user.name,
      text,
      time: nowISO()
    });

    await post.save();
    return res.json(post);
  } catch {
    return res.status(500).json({ message: "Failed to add comment" });
  }
});

/* ================= STORIES ================= */

app.post("/api/stories", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const story = await Story.create({
      userId: String(user._id),
      name: user.name,
      avatar: user.avatar,
      image: `/uploads/${req.file.filename}`,
      seenBy: []
    });

    return res.status(201).json(story);
  } catch {
    return res.status(500).json({ message: "Story upload failed" });
  }
});

app.get("/api/stories", async (_req, res) => {
  try {
    const stories = await Story.find({}).sort({ createdAt: -1 }).lean();
    return res.json(stories);
  } catch {
    return res.status(500).json({ message: "Failed to load stories" });
  }
});

app.post("/api/stories/:id/seen", authMiddleware, async (req, res) => {
  try {
    const storyId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: "Invalid story id" });
    }

    const [story, user] = await Promise.all([
      Story.findById(storyId),
      User.findById(req.user.id).select("_id name")
    ]);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = String(user._id);
    const seen = story.seenBy.some((entry) => String(entry.userId) === userId);
    if (!seen) {
      story.seenBy.push({
        userId,
        name: user.name,
        time: nowISO()
      });
      await story.save();
    }

    return res.json({ success: true, seenBy: story.seenBy });
  } catch {
    return res.status(500).json({ message: "Failed to mark story as seen" });
  }
});

/* ================= MESSENGER ================= */

app.post("/api/conversations", authMiddleware, async (req, res) => {
  try {
    const receiverId = String(req.body?.receiverId || "");
    const senderId = String(req.user.id || "");

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "receiverId is required" });
    }
    if (receiverId === senderId) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId]
      });
    }

    return res.json(conversation);
  } catch {
    return res.status(500).json({ message: "Failed to create conversation" });
  }
});

app.get("/api/conversations/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.params.userId || "");
    if (userId !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const conversations = await Conversation.find({
      members: userId
    }).sort({ updatedAt: -1 });

    return res.json(conversations);
  } catch {
    return res.status(500).json({ message: "Failed to load conversations" });
  }
});

app.get("/api/messages/:conversationId", authMiddleware, async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || "");
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!(conversation.members || []).map(String).includes(String(req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    return res.json(messages);
  } catch {
    return res.status(500).json({ message: "Failed to load messages" });
  }
});

/* ================= FRONTEND ================= */

app.use(express.static(FRONTEND_DIST));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }

  if (req.path.startsWith("/uploads")) {
    return res.status(404).send("Not found");
  }

  if (!fs.existsSync(INDEX_HTML_PATH)) {
    return res
      .status(500)
      .send("Frontend build not found. Run build to generate dist.");
  }

  return res.sendFile(INDEX_HTML_PATH);
});

app.use((err, _req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({
    message: err.message || "Internal server error"
  });
});

server.listen(PORT, () => {
  console.log(`[server] PyrexxBook API listening on port ${PORT}`);
});
