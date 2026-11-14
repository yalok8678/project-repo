import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  address: { street: String, city: String, state: String, country: { type: String, default: "India" }, pincode: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rejectionReason: { type: String, default: "" },
  commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
  totalSales: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Vendor", schema);
