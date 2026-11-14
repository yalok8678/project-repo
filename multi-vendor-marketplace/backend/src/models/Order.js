import mongoose from "mongoose";

const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    name: String, image: String, price: Number, quantity: Number,
    subtotal: Number, commission: Number, vendorEarning: Number
  }],
  vendorGroups: [{
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    status: { type: String, enum: ["placed", "packed", "shipped", "delivered", "cancelled"], default: "placed" }
  }],
  shippingAddress: { name: String, phone: String, street: String, city: String, state: String, pincode: String, country: { type: String, default: "India" } },
  subtotal: Number, discount: { type: Number, default: 0 }, shippingFee: { type: Number, default: 0 },
  totalAmount: Number, platformCommission: { type: Number, default: 0 },
  couponCode: String, paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  razorpayOrderId: String, razorpayPaymentId: String, status: { type: String, default: "placed" }, paidAt: Date
}, { timestamps: true });

export default mongoose.model("Order", schema);
