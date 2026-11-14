import { randomUUID } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

export async function saveImage(file) {
  if (!s3 || !process.env.AWS_S3_BUCKET) {
    throw new Error("Image upload requires AWS S3 configuration. Set AWS_REGION, AWS_S3_BUCKET and credentials.");
  }
  const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg");
  const key = `products/${randomUUID()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype }));
  return { key, url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` };
}
export async function removeImage(key) {
  if (s3 && process.env.AWS_S3_BUCKET && key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
}
