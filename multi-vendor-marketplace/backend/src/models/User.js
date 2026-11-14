import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, default: "" },
  role: { type: String, enum: ["customer", "vendor", "admin"], default: "customer" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", schema);
