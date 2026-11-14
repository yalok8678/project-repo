import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { saveImage, removeImage } from "../services/media.js";
import { indexProduct, searchCatalog } from "../services/search.js";

const slug = (s) => `${s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
async function approvedVendor(userId) { return Vendor.findOne({ user: userId, status: "approved" }); }

export async function list(req, res) {
  const { q, category, minPrice, maxPrice, sort = "newest", page = 1, limit = 12 } = req.query;
  const p = Math.max(1, Number(page) || 1), l = Math.min(50, Math.max(1, Number(limit) || 12));
  let products;
  if (q) {
    products = await searchCatalog(q);
    if (category) products = products.filter(x => x.category === category);
    if (minPrice) products = products.filter(x => x.price >= Number(minPrice));
    if (maxPrice) products = products.filter(x => x.price <= Number(maxPrice));
    if (sort === "price-low") products.sort((a,b) => a.price-b.price);
    if (sort === "price-high") products.sort((a,b) => b.price-a.price);
    products = products.filter(x => x.vendor);
    return res.json({ success: true, total: products.length, products: products.slice((p-1)*l,p*l), page: p, pages: Math.ceil(products.length/l) });
  }
  const filter = { isActive: true, stock: { $gt: 0 } };
  if (category) filter.category = category;
  if (minPrice || maxPrice) { filter.price = {}; if (minPrice) filter.price.$gte = Number(minPrice); if (maxPrice) filter.price.$lte = Number(maxPrice); }
  const sortMap = { newest: { createdAt: -1 }, "price-low": { price: 1 }, "price-high": { price: -1 }, rating: { ratings: -1 } };
  const [rows, total] = await Promise.all([
    Product.find(filter).populate({ path: "vendor", match: { status: "approved" }, select: "businessName" }).sort(sortMap[sort] || sortMap.newest).skip((p-1)*l).limit(l),
    Product.countDocuments(filter)
  ]);
  const visible = rows.filter(x => x.vendor);
  res.json({ success: true, total, products: visible, page: p, pages: Math.ceil(total/l) });
}
export async function getOne(req, res) {
  const product = await Product.findOne({ $or: [{ slug: req.params.id }, ...( /^[0-9a-fA-F]{24}$/.test(req.params.id) ? [{ _id: req.params.id }] : [])], isActive: true }).populate({ path: "vendor", match: { status: "approved" }, select: "businessName" });
  if (!product || !product.vendor) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true, product });
}
export async function mine(req, res) {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
  res.json({ success: true, products });
}
export async function create(req, res) {
  const vendor = await approvedVendor(req.user._id);
  if (!vendor) return res.status(403).json({ message: "Approved vendor account required" });
  const { name, description, category, brand, price, comparePrice, stock, sku } = req.body;
  if (!name || !description || !category || price === undefined || stock === undefined || Number(price) < 0 || Number(stock) < 0) return res.status(400).json({ message: "Valid name, description, category, price and stock required" });
  const images = [];
  for (const file of req.files || []) images.push(await saveImage(file));
  const product = await Product.create({ vendor: vendor._id, name, slug: slug(name), description, category, brand, price: Number(price), comparePrice: Number(comparePrice || 0), stock: Number(stock), sku, images });
  await indexProduct(product);
  res.status(201).json({ success: true, product });
}
export async function update(req, res) {
  const vendor = await approvedVendor(req.user._id);
  if (!vendor) return res.status(403).json({ message: "Approved vendor required" });
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) return res.status(404).json({ message: "Product not found" });
  const fields = ["name","description","category","brand","price","comparePrice","stock","sku","isActive"];
  for (const f of fields) if (req.body[f] !== undefined) product[f] = req.body[f];
  if (req.body.name) product.slug = slug(req.body.name);
  for (const file of req.files || []) product.images.push(await saveImage(file));
  await product.save(); await indexProduct(product);
  res.json({ success: true, product });
}
export async function remove(req, res) {
  const vendor = await approvedVendor(req.user._id);
  if (!vendor) return res.status(403).json({ message: "Approved vendor required" });
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) return res.status(404).json({ message: "Product not found" });
  for (const image of product.images) if (image.key) await removeImage(image.key);
  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
}
