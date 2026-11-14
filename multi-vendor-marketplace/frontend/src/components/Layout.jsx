import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, User, LogOut, Store, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Layout({children}) {
  const {user,logout}=useAuth(), [q,setQ]=useState(""), navigate=useNavigate();
  const submit=e=>{e.preventDefault();navigate(`/?q=${encodeURIComponent(q)}`);};
  return <><header className="topbar"><Link to="/" className="brand"><span className="brand-mark">M</span> MarketHub</Link>
    <form className="searchbar" onSubmit={submit}><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products, brands and categories..."/><button>Search</button></form>
    <nav><NavLink to="/">Shop</NavLink><NavLink to="/cart"><ShoppingBag size={18}/> Cart</NavLink>{user ? <><NavLink to={user.role==="admin"?"/admin":user.role==="vendor"?"/vendor":"/account"}><User size={18}/>{user.name.split(" ")[0]}</NavLink><button className="icon-button" title="Logout" onClick={()=>{logout();navigate("/");}}><LogOut size={18}/></button></> : <Link className="login-link" to="/login">Sign in</Link>}</nav>
  </header><main>{children}</main><footer><div className="footer-inner"><b>MarketHub</b><span>One marketplace. Many great stores.</span><span>© {new Date().getFullYear()} MarketHub</span></div></footer></>;
}
