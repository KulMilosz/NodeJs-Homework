import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "domyslny_klucz";
export function generateToken(user) {
    return jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role
    }, JWT_SECRET, { expiresIn: "1h" });
}
export function getUserFromToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (typeof payload === "object" && payload.id && payload.username && payload.role) {
            return {
                id: payload.id,
                username: payload.username,
                role: payload.role,
                password: "",
                balance: 0
            };
        }
        return null;
    }
    catch (err) {
        return null;
    }
}
export function setAuthCookie(res, token) {
    res.setHeader('Set-Cookie', `authToken=${token}; Path=/; HttpOnly`);
}
export function parseCookies(req) {
    const cookieHeader = req.headers.cookie || "";
    return Object.fromEntries(cookieHeader.split(';').map(c => {
        const [k, v] = c.trim().split('=');
        return [k, v];
    }));
}
