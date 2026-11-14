import { useEffect,useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
export default function Storefront(){
  const [params,setParams]=useSearchParams(), [products,setProducts]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [category,setCategory]=useState(""),[sort,setSort]=useState("newest"),[min,setMin]=useState(""),[max,setMax]=useState("");
  const q=params.get("q")||"";
  useEffect(()=>{setLoading(true);api.get("/products",{params:{q,category,minPrice:min,maxPrice:max,sort}}).then(r=>setProducts(r.data.products)).catch(e=>setError(e.response?.data?.message||"Could not load products")).finally(()=>setLoading(false));},[q,category,sort,min,max]);
  return <><section className="hero"><div><span className="eyebrow">THE MARKETPLACE FOR EVERYONE</span><h1>Discover products.<br/><em>Support independent stores.</em></h1><p>Shop thousands of finds from sellers you can trust.</p><a className="button light" href="#catalog">Explore marketplace</a></div><div className="hero-art"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-bag">M</div><span className="float-tag tag-a">New arrivals</span><span className="float-tag tag-b">Great finds ↗</span></div></section>
  <section id="catalog" className="catalog-section"><div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>{q?`Results for “${q}”`:"Explore the marketplace"}</h2><p className="muted">Find something you'll love from our vendor community.</p></div><span className="result-count">{products.length} products</span></div>
  <div className="filters"><div className="filter-label"><SlidersHorizontal size={16}/> Filters</div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{["Electronics","Fashion","Home","Beauty","Sports","Books","Accessories","Other"].map(x=><option key={x}>{x}</option>)}</select><input placeholder="Min ₹" type="number" value={min} onChange={e=>setMin(e.target.value)}/><input placeholder="Max ₹" type="number" value={max} onChange={e=>setMax(e.target.value)}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></div>
  {loading?<div className="empty-state">Loading marketplace…</div>:error?<div className="empty-state">{error}</div>:products.length?<div className="product-grid">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>:<div className="empty-state"><div className="empty-icon">⌕</div><h3>No products yet</h3><p>Products from approved vendors will appear here.</p></div>}</section></>;
}
