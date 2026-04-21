import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userModel } from "../models/userModel.js";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export async function signup({ name, email, password, role = "student" }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedRole = String(role).toUpperCase() === "ADMIN" ? "ADMIN" : "STUDENT";

  const user = await userModel.create({
    name,
    email,
    password: passwordHash,
    role: normalizedRole,
  });

  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
