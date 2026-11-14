import { prisma } from './db.js';
export async function membership(userId, workspaceId) {
  return prisma.membership.findUnique({where:{userId_workspaceId:{userId,workspaceId}}});
}
export async function requireWorkspace(req,res,next) {
  const workspaceId = req.params.workspaceId || req.body.workspaceId;
  const member = await membership(req.user.id, workspaceId);
  if (!member) return res.status(403).json({error:'Workspace access denied'});
  req.member = member; next();
}
export const canEdit = role => ['OWNER','ADMIN','EDITOR'].includes(role);
export const canComment = role => ['OWNER','ADMIN','EDITOR','COMMENTER'].includes(role);
