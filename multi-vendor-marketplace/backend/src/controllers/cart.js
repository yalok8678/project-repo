import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { getCart, setCart, clearCart } from "../services/cart.js";

export async function get(req, res) {
  const items = await getCart(req.user._id);
  const ids = items.map(x => x.productId);
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate({ path: "vendor", select: "businessName status" });
  const result = items.map(i => ({ ...i, product: products.find(p => String(p._id) === i.productId) })).filter(i => i.product?.vendor?.status === "approved");
  res.json({ success: true, items: result, subtotal: result.reduce((s,i) => s + i.product.price*i.quantity, 0) });
}
export async function add(req, res) {
  const { productId, quantity = 1 } = req.body;
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return res.status(400).json({ message: "Invalid quantity" });
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product || product.stock < qty) return res.status(400).json({ message: "Product unavailable or insufficient stock" });
  const vendor = await Vendor.findOne({ _id: product.vendor, status: "approved" });
  if (!vendor) return res.status(400).json({ message: "Vendor unavailable" });
  const items = await getCart(req.user._id);
  const found = items.find(x => x.productId === String(product._id));
  if (found) { if (found.quantity + qty > product.stock) return res.status(400).json({ message: "Quantity exceeds stock" }); found.quantity += qty; }
  else items.push({ productId: String(product._id), quantity: qty });
  await setCart(req.user._id, items);
  res.json({ success: true, items });
}
export async function update(req, res) {
  const qty = Number(req.body.quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return res.status(400).json({ message: "Invalid quantity" });
  const items = await getCart(req.user._id), item = items.find(x => x.productId === req.params.productId);
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  const product = await Product.findById(item.productId);
  if (!product || product.stock < qty) return res.status(400).json({ message: "Insufficient stock" });
  item.quantity = qty; await setCart(req.user._id, items); res.json({ success: true, items });
}
export async function remove(req, res) {
  const items = (await getCart(req.user._id)).filter(x => x.productId !== req.params.productId);
  await setCart(req.user._id, items); res.json({ success: true, items });
}
export async function clear(req, res) { await clearCart(req.user._id); res.json({ success: true }); }
