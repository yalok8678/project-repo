import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [user,setUser] = useState(null), [loading,setLoading] = useState(true);
  useEffect(()=>{ if(localStorage.getItem("market_token")) api.get("/auth/me").then(r=>setUser(r.data.user)).catch(()=>localStorage.removeItem("market_token")).finally(()=>setLoading(false)); else setLoading(false); },[]);
  const login = async (email,password) => { const {data}=await api.post("/auth/login",{email,password}); localStorage.setItem("market_token",data.token); setUser(data.user); };
  const register = async form => { const {data}=await api.post("/auth/register",form); localStorage.setItem("market_token",data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem("market_token"); setUser(null); };
  return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
