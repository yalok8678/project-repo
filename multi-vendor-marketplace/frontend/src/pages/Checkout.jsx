import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
export default function Checkout(){
 const {user}=useAuth(),nav=useNavigate(),[cart,setCart]=useState(null),[method,setMethod]=useState("razorpay"),[coupon,setCoupon]=useState(""),[form,setForm]=useState({name:user?.name||"",phone:user?.phone||"",street:"",city:"",state:"",pincode:"",country:"India"}),[busy,setBusy]=useState(false);
 useEffect(()=>{api.get("/cart").then(r=>setCart(r.data)).catch(()=>setCart({items:[]}));},[]);
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const pay=async e=>{e.preventDefault();setBusy(true);try{
   const {data}=await api.post("/orders/checkout",{shippingAddress:form,paymentMethod:method,couponCode:coupon||undefined});
   if(method==="cod"){alert("Order placed successfully");nav("/account");return;}
   const loadScript=()=>new Promise(resolve=>{if(window.Razorpay)return resolve(true);const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.body.appendChild(s);});
   if(!await loadScript())throw new Error("Razorpay checkout failed to load");
   const checkout=new window.Razorpay({key:data.razorpay.key,amount:data.razorpay.amount,currency:data.razorpay.currency,name:"MarketHub",description:"Marketplace order",order_id:data.razorpay.orderId,handler:async response=>{await api.post("/payments/verify",response);alert("Payment successful");nav("/account");},prefill:{name:form.name,contact:form.phone},theme:{color:"#5b5bd6"}});
   checkout.open();
 }catch(e){alert(e.response?.data?.message||e.message||"Checkout failed");}finally{setBusy(false);}};
 if(!cart)return <div className="empty-state">Loading…</div>;if(!cart.items.length)return <div className="empty-state">Your cart is empty</div>;
 return <div className="page-wrap narrow"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1><form className="checkout-card" onSubmit={pay}><h3>Delivery address</h3><div className="form-grid"><label>Full name<input name="name" required value={form.name} onChange={change}/></label><label>Phone<input name="phone" required value={form.phone} onChange={change}/></label><label className="wide">Street address<input name="street" required value={form.street} onChange={change}/></label><label>City<input name="city" required value={form.city} onChange={change}/></label><label>State<input name="state" value={form.state} onChange={change}/></label><label>PIN code<input name="pincode" required value={form.pincode} onChange={change}/></label></div><h3>Coupon code</h3><input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Enter coupon code (optional)"/><h3>Payment method</h3><label className="radio-line"><input type="radio" checked={method==="razorpay"} onChange={()=>setMethod("razorpay")}/> Razorpay (UPI, cards, net banking)</label><label className="radio-line"><input type="radio" checked={method==="cod"} onChange={()=>setMethod("cod")}/> Cash on delivery</label><div className="summary-total"><span>Subtotal</span><b>₹{cart.subtotal.toLocaleString("en-IN")}</b></div><p className="muted small">Shipping and any eligible discount are calculated by the server.</p><button disabled={busy} className="button primary full">{busy?"Processing…":method==="cod"?"Place COD order":"Continue to payment"}</button></form></div>;
}
