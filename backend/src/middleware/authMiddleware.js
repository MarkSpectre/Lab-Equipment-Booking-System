import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userModel } from "../models/userModel.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Missing authentication token." });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await userModel.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const currentRole = String(req.user.role || "").toUpperCase();
    const allowedRoles = roles.map((role) => String(role).toUpperCase());

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return next();
  };
}
