import mongoose from "mongoose";

const schema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  brand: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, min: 0 },
  images: [{ url: String, key: String }],
  sku: String,
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ name: "text", description: "text", category: "text", brand: "text" });
export default mongoose.model("Product", schema);
