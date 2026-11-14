import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in .env");
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin"; existing.isActive = true;
    if (password) existing.password = await bcrypt.hash(password,12);
    await existing.save();
    console.log("Admin account updated:", email);
  } else {
    await User.create({ name:"Marketplace Admin", email, password:await bcrypt.hash(password,12), role:"admin" });
    console.log("Admin created:", email);
  }
} catch (e) {
  console.error(e.message); process.exitCode = 1;
} finally { await mongoose.disconnect(); }
