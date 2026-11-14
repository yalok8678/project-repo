import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db.js';
import { auth, signToken, collabToken } from './auth.js';
import { membership, requireWorkspace, canEdit, canComment } from './access.js';
const r = Router();
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);

r.post('/auth/register', wrap(async(req,res)=>{
  const data=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8)}).parse(req.body);
  const exists=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});
  if(exists) return res.status(409).json({error:'Email already registered'});
  const user=await prisma.user.create({data:{name:data.name,email:data.email.toLowerCase(),passwordHash:await bcrypt.hash(data.password,12)}});
  res.status(201).json({token:signToken(user),user:{id:user.id,name:user.name,email:user.email}});
}));
r.post('/auth/login', wrap(async(req,res)=>{
  const data=z.object({email:z.string().email(),password:z.string()}).parse(req.body);
  const user=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});
  if(!user || !(await bcrypt.compare(data.password,user.passwordHash))) return res.status(401).json({error:'Invalid email or password'});
  res.json({token:signToken(user),user:{id:user.id,name:user.name,email:user.email}});
}));
r.get('/me',auth,(req,res)=>res.json({user:req.user}));
r.get('/collab-token',auth,collabToken);

r.get('/workspaces',auth,wrap(async(req,res)=>{
  const memberships=await prisma.membership.findMany({where:{userId:req.user.id},include:{workspace:true}});
  res.json(memberships.map(m=>({...m.workspace,role:m.role})));
}));
r.post('/workspaces',auth,wrap(async(req,res)=>{
  const name=z.string().min(2).max(80).parse(req.body.name);
  const ws=await prisma.workspace.create({data:{name,memberships:{create:{userId:req.user.id,role:'OWNER'}}}});
  res.status(201).json(ws);
}));
r.get('/workspaces/:workspaceId',auth,wrap(async(req,res)=>{
  const m=await membership(req.user.id,req.params.workspaceId);
  if(!m) return res.status(403).json({error:'Workspace access denied'});
  const ws=await prisma.workspace.findUnique({where:{id:req.params.workspaceId},include:{memberships:{include:{user:{select:{id:true,name:true,email:true}}}},pages:{orderBy:{updatedAt:'desc'}}}});
  res.json({...ws,myRole:m.role});
}));
r.post('/workspaces/:workspaceId/members',auth,wrap(async(req,res)=>{
  const m=await membership(req.user.id,req.params.workspaceId);
  if(!m || !['OWNER','ADMIN'].includes(m.role)) return res.status(403).json({error:'Only workspace admins can add members'});
  const data=z.object({email:z.string().email(),role:z.enum(['ADMIN','EDITOR','COMMENTER','VIEWER'])}).parse(req.body);
  const user=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});
  if(!user) return res.status(404).json({error:'User must register before being added'});
  const member=await prisma.membership.upsert({where:{userId_workspaceId:{userId:user.id,workspaceId:req.params.workspaceId}},create:{userId:user.id,workspaceId:req.params.workspaceId,role:data.role},update:{role:data.role}});
  res.status(201).json({id:member.id,role:member.role,email:user.email});
}));
r.patch('/workspaces/:workspaceId/members/:memberId',auth,wrap(async(req,res)=>{
  const me=await membership(req.user.id,req.params.workspaceId);
  if(!me || !['OWNER','ADMIN'].includes(me.role)) return res.status(403).json({error:'Not allowed'});
  const role=z.enum(['ADMIN','EDITOR','COMMENTER','VIEWER']).parse(req.body.role);
  const updated=await prisma.membership.update({where:{id:req.params.memberId},data:{role}});
  res.json(updated);
}));
r.post('/workspaces/:workspaceId/pages',auth,wrap(async(req,res)=>{
  const m=await membership(req.user.id,req.params.workspaceId);
  if(!m || !canEdit(m.role)) return res.status(403).json({error:'Edit permission required'});
  const title=z.string().min(1).max(160).default('Untitled').parse(req.body.title || 'Untitled');
  const page=await prisma.page.create({data:{workspaceId:req.params.workspaceId,title}});
  res.status(201).json(page);
}));
r.get('/pages/:pageId',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId},include:{workspace:true}});
  if(!page) return res.status(404).json({error:'Page not found'});
  const m=await membership(req.user.id,page.workspaceId);
  if(!m) return res.status(403).json({error:'Page access denied'});
  res.json({...page,myRole:m.role});
}));
r.patch('/pages/:pageId',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId}});
  if(!page) return res.status(404).json({error:'Page not found'});
  const m=await membership(req.user.id,page.workspaceId);
  if(!m || !canEdit(m.role)) return res.status(403).json({error:'Edit permission required'});
  const title=z.string().min(1).max(160).parse(req.body.title);
  res.json(await prisma.page.update({where:{id:page.id},data:{title}}));
}));
r.get('/pages/:pageId/comments',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId}});
  if(!page || !(await membership(req.user.id,page.workspaceId))) return res.status(403).json({error:'Access denied'});
  res.json(await prisma.comment.findMany({where:{pageId:page.id},include:{user:{select:{name:true,email:true}}},orderBy:{createdAt:'asc'}}));
}));
r.post('/pages/:pageId/comments',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId}});
  const m=page && await membership(req.user.id,page.workspaceId);
  if(!m || !canComment(m.role)) return res.status(403).json({error:'Comment permission required'});
  const body=z.string().min(1).max(3000).parse(req.body.body);
  res.status(201).json(await prisma.comment.create({data:{pageId:page.id,userId:req.user.id,body},include:{user:{select:{name:true}}}}));
}));
r.get('/pages/:pageId/snapshots',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId}});
  if(!page || !(await membership(req.user.id,page.workspaceId))) return res.status(403).json({error:'Access denied'});
  const items=await prisma.snapshot.findMany({where:{pageId:page.id},select:{id:true,label:true,createdAt:true},orderBy:{createdAt:'desc'}});
  res.json(items);
}));
r.post('/pages/:pageId/snapshots',auth,wrap(async(req,res)=>{
  const page=await prisma.page.findUnique({where:{id:req.params.pageId}});
  const m=page && await membership(req.user.id,page.workspaceId);
  if(!m || !canEdit(m.role)) return res.status(403).json({error:'Edit permission required'});
  const data=z.object({state:z.string().min(1),label:z.string().max(100).optional()}).parse(req.body);
  res.status(201).json(await prisma.snapshot.create({data:{pageId:page.id,state:data.state,label:data.label}}));
}));
r.get('/snapshots/:snapshotId',auth,wrap(async(req,res)=>{
  const snap=await prisma.snapshot.findUnique({where:{id:req.params.snapshotId},include:{page:true}});
  if(!snap || !(await membership(req.user.id,snap.page.workspaceId))) return res.status(403).json({error:'Access denied'});
  res.json(snap);
}));
r.get('/health',async(req,res)=>res.json({ok:true,service:'collabspace-api'}));
export default r;
