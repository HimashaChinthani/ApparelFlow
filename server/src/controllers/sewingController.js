const verificationService = require("../services/verificationService");

const queue = async (req, res) => {
    try { res.json(await verificationService.getSewingQueue()); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

const start = async (req, res) => {
    try { res.json(await verificationService.startSewing(req.params.id)); }
    catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};

module.exports = { queue, start };