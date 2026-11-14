import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone });

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: "Name, valid email and password (8+ characters) required" });
  const normalized = email.toLowerCase().trim();
  if (await User.findOne({ email: normalized })) return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({ name, email: normalized, password: await bcrypt.hash(password, 12), phone, role: "customer" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
  res.status(201).json({ success: true, token, user: publicUser(user) });
}
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase().trim() }).select("+password");
  if (!user || !await bcrypt.compare(password || "", user.password)) return res.status(401).json({ message: "Invalid email or password" });
  if (!user.isActive) return res.status(403).json({ message: "Account disabled" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
  res.json({ success: true, token, user: publicUser(user) });
}
export async function me(req, res) { res.json({ success: true, user: publicUser(req.user) }); }
