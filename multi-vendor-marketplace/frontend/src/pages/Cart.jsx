import { useEffect,useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus } from "lucide-react";
import api from "../api";
export default function Cart(){
 const [data,setData]=useState({items:[],subtotal:0}),[busy,setBusy]=useState(true),nav=useNavigate();
 const load=()=>api.get("/cart").then(r=>setData(r.data)).catch(()=>setData({items:[],subtotal:0})).finally(()=>setBusy(false));
 useEffect(()=>{load();},[]);
 const update=async(id,quantity)=>{await api.patch(`/cart/${id}`,{quantity});load();};
 const remove=async id=>{await api.delete(`/cart/${id}`);load();};
 if(busy)return <div className="empty-state">Loading cart…</div>;
 return <div className="page-wrap"><div className="section-heading"><div><span className="eyebrow">YOUR SELECTION</span><h1>Shopping cart</h1></div><Link to="/">Continue shopping</Link></div>{!data.items.length?<div className="empty-state"><h2>Your cart is empty</h2><p>Find something great in the marketplace.</p><Link className="button primary" to="/">Start shopping</Link></div>:<div className="cart-layout"><div className="cart-list">{data.items.map(i=><div className="cart-item" key={i.productId}><div className="cart-thumb">{i.product.images?.[0]?.url?<img src={i.product.images[0].url}/>: "MH"}</div><div className="cart-item-copy"><Link to={`/product/${i.product.slug||i.product._id}`}><b>{i.product.name}</b></Link><span className="muted">{i.product.vendor?.businessName}</span><b>₹{i.product.price.toLocaleString("en-IN")}</b><div className="quantity-row compact"><button onClick={()=>update(i.productId,Math.max(1,i.quantity-1))}><Minus size={13}/></button>{i.quantity}<button onClick={()=>update(i.productId,i.quantity+1)}><Plus size={13}/></button><button className="remove-button" onClick={()=>remove(i.productId)}><Trash2 size={15}/> Remove</button></div></div></div>)}</div><aside className="summary-card"><h3>Order summary</h3><div className="summary-line"><span>Subtotal</span><b>₹{data.subtotal.toLocaleString("en-IN")}</b></div><div className="summary-line"><span>Shipping</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Estimated total</span><b>₹{data.subtotal.toLocaleString("en-IN")}</b></div><button className="button primary full" onClick={()=>nav("/checkout")}>Proceed to checkout</button></aside></div>}</div>;
}
