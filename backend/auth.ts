import { IncomingMessage, ServerResponse } from 'http';
import jwt from "jsonwebtoken";
import { User } from "./types.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "domyslny_klucz";

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      balance: user.balance
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function getUserFromToken(token: string): User | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload === "object" && payload.id && payload.username && payload.role) {
      return {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        password: "",
        balance: payload.balance || 0
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function setAuthCookie(res: ServerResponse, token: string) {
  res.setHeader('Set-Cookie', `authToken=${token}; Path=/; HttpOnly`);
}

export function removeAuthCookie(res: ServerResponse) {
  res.setHeader('Set-Cookie', 'authToken=; Path=/; HttpOnly; Max-Age=0');
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookieHeader = req.headers.cookie || "";
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, v] = c.trim().split('=');
      return [k, v];
    })
  );
}
