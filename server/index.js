const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => res.json({ message: "ChatApp server running ✅" }));

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User comes online
  socket.on("user_online", async (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} is online`);
  });

  // Join a private room (one room per conversation pair)
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  // Handle sending a message
  socket.on("send_message", async (data) => {
    const { senderId, receiverId, text, roomId } = data;
    try {
      const message = new Message({ sender: senderId, receiver: receiverId, text, roomId });
      await message.save();
      await message.populate("sender", "username avatar");

      // Emit to both users in the room
      io.to(roomId).emit("receive_message", message);

      // If receiver is online but not in this room, send notification
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message_notification", {
          senderId,
          message: message,
        });
      }
    } catch (err) {
      console.error("Message save error:", err);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Typing indicators
  socket.on("typing_start", ({ roomId, userId, username }) => {
    socket.to(roomId).emit("user_typing", { userId, username });
  });

  socket.on("typing_stop", ({ roomId, userId }) => {
    socket.to(roomId).emit("user_stopped_typing", { userId });
  });

  // Mark messages as read
  socket.on("mark_read", async ({ roomId, userId }) => {
    await Message.updateMany(
      { roomId, receiver: userId, read: false },
      { $set: { read: true } }
    );
    socket.to(roomId).emit("messages_read", { roomId, userId });
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log(`User ${socket.userId} went offline`);
    }
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
