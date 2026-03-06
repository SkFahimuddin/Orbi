const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

// GET /api/users - search users (exclude self)
router.get("/", protect, async (req, res) => {
  try {
    const search = req.query.search || "";
    const users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: search, $options: "i" },
    })
      .select("-password -email")
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:id - get user profile
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PATCH /api/users/me - update profile
router.patch("/me/update", protect, async (req, res) => {
  try {
    const { about, avatarColor } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { about, avatarColor },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
