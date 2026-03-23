const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
 
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ error: "Chybí email nebo heslo" });
    }
 
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Nesprávný email nebo heslo" });
    }
 
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: "Nesprávný email nebo heslo" });
    }
 
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
 
    res.json({ token, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});
 
// POST /api/auth/seed — vytvoří admin účet (zavolej jednou po deployi)
// Po vytvoření účtu tuto route NEDÁVEJ na produkci nebo ji odstraň
router.post("/seed", async (req, res) => {
  try {
    const existingUser = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });
 
    if (existingUser) {
      return res.status(409).json({ message: "Admin účet již existuje" });
    }
 
    const user = new User({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    await user.save();
 
    res.status(201).json({ message: "Admin účet vytvořen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});
 
module.exports = router;