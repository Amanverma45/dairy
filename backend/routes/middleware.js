import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "milkflow_super_secret_jwt_key_123";

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Owner authorization middleware
export const requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ error: "Access denied. Owner privilege required." });
  }
  next();
};
