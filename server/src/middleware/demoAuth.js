const crypto = require("node:crypto");

const DEMO_USERS = {
    cutting_supervisor: { id: "00000000-0000-0000-0000-000000000001", role: "cutting_supervisor", full_name: "Maya Fernando", password_hash: "demo" },
    cutting_verifier: { id: "00000000-0000-0000-0000-000000000002", role: "cutting_verifier", full_name: "Nadia Perera", password_hash: "demo" },
    sewing_supervisor: { id: "00000000-0000-0000-0000-000000000003", role: "sewing_supervisor", full_name: "Ravi Silva", password_hash: "demo" }
};

const TOKEN_SECRET = process.env.AUTH_SECRET || "apparelflow-development-secret";
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (value) => crypto.createHmac("sha256", TOKEN_SECRET).update(value).digest("base64url");

const createDemoToken = (role) => {
    const user = DEMO_USERS[role];
    if (!user) return null;
    const { password_hash, ...publicUser } = user;
    const payload = encode({ ...publicUser, exp: Date.now() + 8 * 60 * 60 * 1000 });
    return `${payload}.${sign(payload)}`;
};

const verifyToken = (token) => {
    const [payload, signature] = String(token || "").split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try {
        const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return user.exp > Date.now() && DEMO_USERS[user.role]?.id === user.id ? DEMO_USERS[user.role] : null;
    } catch {
        return null;
    }
};

const login = (req, res) => {
    const { role, password } = req.body || {};
    if (!DEMO_USERS[role] || password !== DEMO_USERS[role].password_hash) return res.status(401).json({ message: "Invalid demo credentials" });
    const token = createDemoToken(role);
    if (!token) return res.status(401).json({ message: "Unknown demo role" });
    const { password_hash, ...publicUser } = DEMO_USERS[role];
    res.json({ token, user: publicUser });
};

const attachDemoUser = (req, res, next) => {
    const authorization = req.header("authorization");
    const user = authorization?.startsWith("Bearer ") ? verifyToken(authorization.slice(7)) : null;
    if (!user) return res.status(401).json({ message: "Authentication required" });
    req.user = user;
    next();
};

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "This role cannot perform that action" });
    next();
};

module.exports = { attachDemoUser, requireRole, login, createDemoToken };
