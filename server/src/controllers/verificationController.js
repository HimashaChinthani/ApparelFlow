const verificationService = require("../services/verificationService");

const pending = async (req, res) => {
    try { res.json(await verificationService.getPendingOrders()); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

const decide = async (req, res) => {
    const { decision, rejection_note, items } = req.body;
    if (!["APPROVED", "REJECTED"].includes(decision)) return res.status(400).json({ message: "decision must be APPROVED or REJECTED" });
    try {
        res.json(await verificationService.recordDecision({ orderId: req.params.id, verifierId: req.user.id, decision, rejectionNote: rejection_note, items }));
    } catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

module.exports = { pending, decide };