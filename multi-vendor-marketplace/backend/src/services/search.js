import es from "../config/elasticsearch.js";
import Product from "../models/Product.js";

export async function indexProduct(p) {
  if (!es) return;
  try {
    await es.index({ index: "products", id: String(p._id), document: {
      name: p.name, description: p.description, category: p.category,
      brand: p.brand, price: p.price, stock: p.stock, isActive: p.isActive
    }, refresh: true });
  } catch (e) { console.warn("Elasticsearch indexing:", e.message); }
}
export async function searchCatalog(q) {
  if (es) {
    try {
      const result = await es.search({ index: "products", query: { bool: {
        must: [{ multi_match: { query: q, fields: ["name^3", "category^2", "brand", "description"] } }],
        filter: [{ term: { isActive: true } }, { range: { stock: { gt: 0 } } }]
      } } });
      const ids = result.hits.hits.map(h => h._id);
      return Product.find({ _id: { $in: ids }, isActive: true, stock: { $gt: 0 } }).populate({ path: "vendor", match: { status: "approved" }, select: "businessName" });
    } catch (e) { console.warn("Search fallback:", e.message); }
  }
  return Product.find({ $text: { $search: q }, isActive: true, stock: { $gt: 0 } }).populate({ path: "vendor", match: { status: "approved" }, select: "businessName" });
}
