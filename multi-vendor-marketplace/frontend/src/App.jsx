import { Routes,Route,Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Storefront from "./pages/Storefront";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboards";
import { useAuth } from "./context/AuthContext";

function Guard({children,roles}){const {user,loading}=useAuth();if(loading)return <div className="empty-state">Loading…</div>;if(!user)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role))return <Navigate to="/" replace/>;return children;}
export default function App(){return <Layout><Routes>
<Route path="/" element={<Storefront/>}/><Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/product/:id" element={<ProductDetail/>}/>
<Route path="/cart" element={<Guard><Cart/></Guard>}/><Route path="/checkout" element={<Guard roles={["customer"]}><Checkout/></Guard>}/><Route path="/account" element={<Guard roles={["customer"]}><Dashboard/></Guard>}/><Route path="/vendor" element={<Guard roles={["vendor"]}><Dashboard/></Guard>}/><Route path="/admin" element={<Guard roles={["admin"]}><Dashboard/></Guard>}/><Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></Layout>;}
