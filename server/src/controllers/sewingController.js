const verificationService = require("../services/verificationService");

const active = async (req, res) => {
    try { res.json(await verificationService.getActiveSewing()); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

const queue = async (req, res) => {
    try { res.json(await verificationService.getSewingQueue()); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

const start = async (req, res) => {
    try { res.json(await verificationService.startSewing(req.params.id)); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

module.exports = { queue, active, start };