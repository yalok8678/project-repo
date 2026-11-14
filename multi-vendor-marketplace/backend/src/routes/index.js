import { Router } from "express";
import { register, login, me } from "../controllers/auth.js";
import { apply, mine, list, approve, reject } from "../controllers/vendors.js";
import * as products from "../controllers/products.js";
import * as cart from "../controllers/cart.js";
import * as orders from "../controllers/orders.js";
import * as misc from "../controllers/misc.js";
import { protect, allow } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const r = Router();
r.get("/health", (req,res)=>res.json({success:true,message:"Marketplace API is running",integrations:{redis:!!process.env.REDIS_URL,elasticsearch:!!process.env.ELASTICSEARCH_URL,s3:!!process.env.AWS_S3_BUCKET,razorpay:!!process.env.RAZORPAY_KEY_ID}}));

r.post("/auth/register", register);
r.post("/auth/login", login);
r.get("/auth/me", protect, me);

r.post("/vendors/apply", protect, allow("customer"), apply);
r.get("/vendors/me", protect, allow("vendor"), mine);
r.get("/vendors", protect, allow("admin"), list);
r.patch("/vendors/:id/approve", protect, allow("admin"), approve);
r.patch("/vendors/:id/reject", protect, allow("admin"), reject);

r.get("/products", products.list);
r.get("/products/:id", products.getOne);
r.get("/vendor/products", protect, allow("vendor"), products.mine);
r.post("/products", protect, allow("vendor"), upload.array("images",5), products.create);
r.patch("/products/:id", protect, allow("vendor"), upload.array("images",5), products.update);
r.delete("/products/:id", protect, allow("vendor"), products.remove);

r.get("/cart", protect, allow("customer"), cart.get);
r.post("/cart", protect, allow("customer"), cart.add);
r.patch("/cart/:productId", protect, allow("customer"), cart.update);
r.delete("/cart/:productId", protect, allow("customer"), cart.remove);
r.delete("/cart", protect, allow("customer"), cart.clear);

r.post("/orders/checkout", protect, allow("customer"), orders.checkout);
r.get("/orders/mine", protect, allow("customer"), orders.myOrders);
r.get("/orders/vendor", protect, allow("vendor"), orders.vendorOrders);
r.patch("/orders/:id/status", protect, allow("vendor"), orders.updateVendorStatus);
r.get("/orders", protect, allow("admin"), orders.allOrders);
r.post("/payments/verify", protect, allow("customer"), orders.verifyPayment);

r.post("/coupons/validate", protect, allow("customer"), misc.validateCoupon);
r.get("/coupons", protect, allow("admin"), misc.listCoupons);
r.post("/coupons", protect, allow("admin"), misc.createCoupon);
r.delete("/coupons/:id", protect, allow("admin"), misc.deleteCoupon);

r.get("/reviews/:productId", misc.listReviews);
r.post("/reviews/:productId", protect, allow("customer"), misc.createReview);
r.get("/invoices/:id", protect, allow("customer"), misc.invoice);

r.get("/admin/dashboard", protect, allow("admin"), misc.dashboard);
r.get("/admin/users", protect, allow("admin"), misc.adminUsers);
export default r;
