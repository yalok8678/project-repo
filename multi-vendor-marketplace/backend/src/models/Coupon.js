import mongoose from "mongoose";

const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  expiresAt: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Coupon", schema);
