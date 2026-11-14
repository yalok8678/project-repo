import Coupon from "../models/Coupon.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import PDFDocument from "pdfkit";

export async function createCoupon(req,res) {
  const { code, discountType="percentage", discountValue, minimumOrder=0, maxDiscount=0, usageLimit=100, expiresAt } = req.body;
  if (!code || Number(discountValue) <= 0) return res.status(400).json({ message: "Coupon code and positive discount required" });
  const c = await Coupon.create({ code, discountType, discountValue, minimumOrder, maxDiscount, usageLimit, expiresAt });
  res.status(201).json({ success: true, coupon: c });
}
export async function listCoupons(req,res) { res.json({ success: true, coupons: await Coupon.find().sort({createdAt:-1}) }); }
export async function validateCoupon(req,res) {
  const { code, subtotal } = req.body;
  const c = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
  if (!c || c.usedCount >= c.usageLimit || (c.expiresAt && c.expiresAt <= new Date()) || Number(subtotal) < c.minimumOrder) return res.status(400).json({ message: "Coupon invalid or unavailable" });
  let discount = c.discountType === "percentage" ? Number(subtotal)*c.discountValue/100 : c.discountValue;
  if (c.maxDiscount > 0) discount = Math.min(discount,c.maxDiscount);
  discount = Math.min(discount,Number(subtotal));
  res.json({ success: true, code: c.code, discount: Number(discount.toFixed(2)) });
}
export async function deleteCoupon(req,res) {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) return res.status(404).json({ message: "Coupon not found" });
  res.json({ success: true });
}
export async function createReview(req,res) {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1 to 5" });
  const purchased = await Order.findOne({ customer: req.user._id, paymentStatus: "paid", "items.product": req.params.productId });
  if (!purchased) return res.status(403).json({ message: "Purchase required before review" });
  const review = await Review.create({ product: req.params.productId, user: req.user._id, rating, comment: req.body.comment || "" });
  const all = await Review.find({ product: req.params.productId });
  await Product.findByIdAndUpdate(req.params.productId, { ratings: all.reduce((s,x)=>s+x.rating,0)/all.length, numReviews: all.length });
  res.status(201).json({ success: true, review });
}
export async function listReviews(req,res) {
  const reviews = await Review.find({ product: req.params.productId }).populate("user","name").sort({createdAt:-1});
  res.json({ success: true, reviews });
}
export async function invoice(req,res) {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id, paymentStatus: "paid" });
  if (!order) return res.status(404).json({ message: "Paid order not found" });
  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition",`attachment; filename=invoice-${order._id}.pdf`);
  const doc = new PDFDocument({ margin: 45 }); doc.pipe(res);
  doc.fontSize(24).text("MARKETPLACE", { align:"center" }).moveDown().fontSize(16).text("INVOICE",{align:"center"}).moveDown();
  doc.fontSize(10).text(`Order: ${order._id}`).text(`Date: ${order.createdAt.toLocaleDateString("en-IN")}`).text(`Customer: ${order.shippingAddress.name}`).text(`Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`).moveDown();
  for (const i of order.items) doc.text(`${i.name} | Qty ${i.quantity} | Rs ${i.price} | Rs ${i.subtotal}`);
  doc.moveDown().text(`Subtotal: Rs ${order.subtotal}`,{align:"right"}).text(`Discount: Rs ${order.discount}`,{align:"right"}).text(`Shipping: Rs ${order.shippingFee}`,{align:"right"}).fontSize(14).text(`Total: Rs ${order.totalAmount}`,{align:"right"}).end();
}
export async function dashboard(req,res) {
  const [customers,vendors,pendingVendors,products,orders,paid,recentOrders] = await Promise.all([
    User.countDocuments({role:"customer"}), Vendor.countDocuments({status:"approved"}), Vendor.countDocuments({status:"pending"}),
    Product.countDocuments(), Order.countDocuments(), Order.find({paymentStatus:"paid"}), Order.find().populate("customer","name email").sort({createdAt:-1}).limit(8)
  ]);
  const revenue = paid.reduce((s,o)=>s+o.totalAmount,0), commission = paid.reduce((s,o)=>s+o.platformCommission,0);
  const monthly = await Order.aggregate([{ $match:{paymentStatus:"paid"} },{ $group:{ _id:{year:{$year:"$createdAt"},month:{$month:"$createdAt"}},revenue:{$sum:"$totalAmount"},commission:{$sum:"$platformCommission"},orders:{$sum:1} } },{ $sort:{"_id.year":1,"_id.month":1} }]);
  res.json({success:true,stats:{customers,vendors,pendingVendors,products,orders,revenue,commission},monthly,recentOrders});
}
export async function adminUsers(req,res) { res.json({success:true,users:await User.find().select("-password").sort({createdAt:-1})}); }
