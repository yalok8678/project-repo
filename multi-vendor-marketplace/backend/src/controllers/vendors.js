import Vendor from "../models/Vendor.js";
import User from "../models/User.js";

export async function apply(req, res) {
  const { businessName, description, email, phone, address } = req.body;
  if (!businessName || !email || !phone) return res.status(400).json({ message: "Business name, email and phone required" });
  const existing = await Vendor.findOne({ user: req.user._id });
  if (existing) return res.status(409).json({ message: "Vendor application already exists", vendor: existing });
  const vendor = await Vendor.create({ user: req.user._id, businessName, description, email, phone, address });
  await User.findByIdAndUpdate(req.user._id, { role: "vendor" });
  res.status(201).json({ success: true, vendor });
}
export async function mine(req, res) {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return res.status(404).json({ message: "Vendor application not found" });
  res.json({ success: true, vendor });
}
export async function list(req, res) {
  const vendors = await Vendor.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json({ success: true, vendors });
}
export async function approve(req, res) {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: "approved", rejectionReason: "" }, { new: true });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json({ success: true, vendor });
}
export async function reject(req, res) {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: "rejected", rejectionReason: req.body.reason || "Application rejected" }, { new: true });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json({ success: true, vendor });
}
