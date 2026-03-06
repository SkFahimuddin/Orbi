const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(400).json({ error: `${field} already in use` });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        about: user.about,
        isOnline: user.isOnline,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        about: user.about,
        isOnline: user.isOnline,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me - get current user
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
