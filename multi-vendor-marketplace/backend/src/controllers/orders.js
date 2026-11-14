import crypto from "node:crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import Coupon from "../models/Coupon.js";
import razorpay from "../config/razorpay.js";
import { getCart, clearCart } from "../services/cart.js";

const commissionRate = Number(process.env.PLATFORM_COMMISSION_PERCENT || 10);

export async function checkout(req, res) {
  const { shippingAddress, paymentMethod = "razorpay", couponCode } = req.body;
  if (!shippingAddress?.name || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.pincode) return res.status(400).json({ message: "Complete shipping address required" });
  if (!["razorpay", "cod"].includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });
  if (paymentMethod === "razorpay" && !razorpay) return res.status(503).json({ message: "Configure Razorpay test keys in backend/.env" });
  const cart = await getCart(req.user._id);
  if (!cart.length) return res.status(400).json({ message: "Cart is empty" });
  const reserved = [], items = [];
  let coupon = null;
  try {
    for (const c of cart) {
      const p = await Product.findOneAndUpdate({ _id: c.productId, isActive: true, stock: { $gte: c.quantity } }, { $inc: { stock: -c.quantity } }, { new: true });
      if (!p) throw new Error("A product is unavailable or out of stock");
      reserved.push({ id: p._id, quantity: c.quantity });
      const v = await Vendor.findOne({ _id: p.vendor, status: "approved" });
      if (!v) throw new Error("A vendor is not approved");
      const subtotal = p.price * c.quantity, rate = Number(v.commissionPercent ?? commissionRate), cut = subtotal * rate / 100;
      items.push({ product: p._id, vendor: v._id, name: p.name, image: p.images[0]?.url || "", price: p.price, quantity: c.quantity, subtotal, commission: cut, vendorEarning: subtotal-cut });
    }
    const subtotal = items.reduce((s,i) => s+i.subtotal, 0);
    let discount = 0;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, usedCount: { $lt: 999999 }, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
      if (!coupon || coupon.usedCount >= coupon.usageLimit || subtotal < coupon.minimumOrder) throw new Error("Coupon invalid or unavailable");
      discount = coupon.discountType === "percentage" ? subtotal*coupon.discountValue/100 : coupon.discountValue;
      if (coupon.maxDiscount > 0) discount = Math.min(discount,coupon.maxDiscount);
      discount = Math.min(discount,subtotal);
    }
    const shippingFee = subtotal-discount >= 999 ? 0 : 60;
    const totalAmount = Number((subtotal-discount+shippingFee).toFixed(2));
    const vendorIds = [...new Set(items.map(i => String(i.vendor)))];
    const vendorGroups = vendorIds.map(vendor => ({ vendor, status: "placed" }));
    const order = await Order.create({
      customer: req.user._id, items, vendorGroups, shippingAddress, subtotal, discount, shippingFee, totalAmount,
      platformCommission: items.reduce((s,i)=>s+i.commission,0), couponCode: coupon?.code, paymentMethod
    });
    if (paymentMethod === "cod") {
      if (coupon) await Coupon.updateOne({ _id: coupon._id, usedCount: { $lt: coupon.usageLimit } }, { $inc: { usedCount: 1 } });
      await clearCart(req.user._id);
      return res.status(201).json({ success: true, order });
    }
    const rpOrder = await razorpay.orders.create({ amount: Math.round(totalAmount*100), currency: "INR", receipt: String(order._id), notes: { orderId: String(order._id) } });
    order.razorpayOrderId = rpOrder.id; await order.save();
    if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
    await clearCart(req.user._id);
    res.status(201).json({ success: true, order, razorpay: { key: process.env.RAZORPAY_KEY_ID, orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency } });
  } catch (e) {
    for (const r of reserved) await Product.updateOne({ _id: r.id }, { $inc: { stock: r.quantity } });
    throw e;
  }
}
export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ message: "Payment fields required" });
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest();
  let received; try { received = Buffer.from(razorpay_signature, "hex"); } catch { return res.status(400).json({ message: "Invalid signature" }); }
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return res.status(400).json({ message: "Payment signature verification failed" });
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, customer: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid"; order.razorpayPaymentId = razorpay_payment_id; order.paidAt = new Date(); await order.save();
    const sums = new Map();
    for (const i of order.items) sums.set(String(i.vendor), (sums.get(String(i.vendor)) || 0) + i.vendorEarning);
    for (const [id, earning] of sums) await Vendor.findByIdAndUpdate(id, { $inc: { totalSales: earning, totalOrders: 1 } });
  }
  res.json({ success: true, order });
}
export async function myOrders(req,res) {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
}
export async function vendorOrders(req,res) {
  const vendor = await Vendor.findOne({ user: req.user._id, status: "approved" });
  if (!vendor) return res.status(403).json({ message: "Approved vendor required" });
  const orders = await Order.find({ "items.vendor": vendor._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders: orders.map(o => ({ ...o.toObject(), items: o.items.filter(i => String(i.vendor) === String(vendor._id)), vendorStatus: o.vendorGroups.find(g => String(g.vendor) === String(vendor._id))?.status })) });
}
export async function updateVendorStatus(req,res) {
  const { status } = req.body, allowed = ["packed","shipped","delivered"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
  const vendor = await Vendor.findOne({ user: req.user._id, status: "approved" });
  const order = await Order.findById(req.params.id);
  if (!vendor || !order) return res.status(404).json({ message: "Vendor or order not found" });
  const group = order.vendorGroups.find(g => String(g.vendor) === String(vendor._id));
  if (!group) return res.status(403).json({ message: "Order does not belong to your store" });
  const transitions = { placed: ["packed"], packed: ["shipped"], shipped: ["delivered"], delivered: [] };
  if (!transitions[group.status]?.includes(status)) return res.status(400).json({ message: "Invalid status transition" });
  group.status = status;
  const statuses = order.vendorGroups.map(g => g.status);
  order.status = statuses.every(s => s === "delivered") ? "delivered" : statuses.every(s => ["shipped","delivered"].includes(s)) ? "shipped" : statuses.every(s => ["packed","shipped","delivered"].includes(s)) ? "packed" : "placed";
  await order.save(); res.json({ success: true, order });
}
export async function allOrders(req,res) {
  const orders = await Order.find().populate("customer","name email").sort({ createdAt: -1 });
  res.json({ success: true, orders });
}
