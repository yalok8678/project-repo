import jwt from 'jsonwebtoken';
import { prisma } from './db.js';
export function signToken(user) {
  return jwt.sign({ sub:user.id, email:user.email }, process.env.JWT_SECRET, { expiresIn:'7d' });
}
export async function auth(req,res,next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
    if (!token) return res.status(401).json({error:'Authentication required'});
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({where:{id:payload.sub}, select:{id:true,name:true,email:true}});
    if (!user) return res.status(401).json({error:'Invalid session'});
    req.user = user; next();
  } catch { return res.status(401).json({error:'Invalid or expired token'}); }
}
export async function collabToken(req,res) {
  const token = jwt.sign({sub:req.user.id, purpose:'collab'}, process.env.COLLAB_TOKEN_SECRET || process.env.JWT_SECRET, {expiresIn:'15m'});
  res.json({token, url:process.env.COLLAB_URL || 'ws://localhost:1234'});
}
