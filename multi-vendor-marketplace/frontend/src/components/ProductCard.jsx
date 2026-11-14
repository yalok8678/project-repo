import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
export default function ProductCard({product,onAdded}) {
  const {user}=useAuth();
  const add=async()=>{if(!user)return alert("Please sign in first");try{await api.post("/cart",{productId:product._id,quantity:1});onAdded?.();alert("Added to cart");}catch(e){alert(e.response?.data?.message||"Could not add item");}};
  return <article className="product-card"><Link to={`/product/${product.slug || product._id}`} className="product-image">{product.images?.[0]?.url?<img src={product.images[0].url} alt={product.name}/>:<div className="image-placeholder">MH</div>}</Link><div className="product-info"><div className="muted small">{product.category}</div><Link to={`/product/${product.slug || product._id}`} className="product-title">{product.name}</Link><div className="rating"><Star size={14} fill="currentColor"/> {Number(product.ratings||0).toFixed(1)} <span>({product.numReviews||0})</span></div><div className="price-row"><b>₹{Number(product.price).toLocaleString("en-IN")}</b>{product.comparePrice>product.price&&<del>₹{product.comparePrice.toLocaleString("en-IN")}</del>}</div><button className="add-button" onClick={add}><ShoppingCart size={16}/> Add to cart</button></div></article>;
}
