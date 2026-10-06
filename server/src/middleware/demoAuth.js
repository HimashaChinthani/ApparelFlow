const DEMO_USERS = {
    cutting_supervisor: { id: "00000000-0000-0000-0000-000000000001", role: "cutting_supervisor", full_name: "Maya Fernando" },
    cutting_verifier: { id: "00000000-0000-0000-0000-000000000002", role: "cutting_verifier", full_name: "Nadia Perera" },
    sewing_supervisor: { id: "00000000-0000-0000-0000-000000000003", role: "sewing_supervisor", full_name: "Ravi Silva" }
};

const attachDemoUser = (req, res, next) => {
    const user = DEMO_USERS[req.header("x-demo-role") || "cutting_supervisor"];
    if (!user) return res.status(401).json({ message: "Unknown demo role" });
    req.user = user;
    next();
};

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "This role cannot perform that action" });
    next();
};

module.exports = { attachDemoUser, requireRole };