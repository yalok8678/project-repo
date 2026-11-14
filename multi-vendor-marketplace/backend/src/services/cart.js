import redis from "../config/redis.js";
const memory = new Map();

export async function getCart(userId) {
  const key = `cart:${userId}`;
  if (redis?.status === "ready") {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : [];
  }
  return memory.get(key) || [];
}
export async function setCart(userId, items) {
  const key = `cart:${userId}`;
  if (redis?.status === "ready") await redis.set(key, JSON.stringify(items), "EX", 604800);
  else memory.set(key, items);
  return items;
}
export async function clearCart(userId) {
  const key = `cart:${userId}`;
  if (redis?.status === "ready") await redis.del(key);
  else memory.delete(key);
}
