import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit:"2mb" }));
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use("/api/auth", rateLimit({ windowMs:15*60*1000, max:100 }));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
export default app;
