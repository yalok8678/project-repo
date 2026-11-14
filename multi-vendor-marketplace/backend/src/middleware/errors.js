export function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";
  if (err.code === 11000) { status = 409; message = "A record with this value already exists"; }
  if (err.name === "ValidationError") { status = 400; message = Object.values(err.errors).map(e => e.message).join(", "); }
  if (err.name === "CastError") { status = 400; message = "Invalid ID"; }
  if (err.name === "MulterError") { status = 400; message = err.message; }
  res.status(status).json({ success: false, message, ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}) });
}
