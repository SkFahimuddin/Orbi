const express = require("express");
const Message = require("../models/Message");
const protect = require("../middleware/auth");

const router = express.Router();

// Generate consistent roomId from two user IDs
const getRoomId = (id1, id2) => [id1, id2].sort().join("_");

// GET /api/messages/:userId - get conversation with a user
router.get("/:userId", protect, async (req, res) => {
  try {
    const roomId = getRoomId(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ roomId })
      .populate("sender", "username avatar avatarColor")
      .sort({ createdAt: 1 })
      .limit(100); // last 100 messages

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /api/messages/conversations/list - get all conversations for sidebar
router.get("/conversations/list", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$read", false] }, { $eq: ["$receiver", req.user._id] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // Populate sender/receiver info
    const populated = await Message.populate(conversations, [
      { path: "lastMessage.sender", select: "username avatar avatarColor isOnline lastSeen" },
      { path: "lastMessage.receiver", select: "username avatar avatarColor isOnline lastSeen" },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

module.exports = router;
