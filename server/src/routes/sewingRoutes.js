const express = require("express");
const { queue, active, start } = require("../controllers/sewingController");
const { attachDemoUser, requireRole } = require("../middleware/demoAuth");

const router = express.Router();
router.use(attachDemoUser, requireRole("sewing_supervisor"));
router.get("/queue", queue);
router.get("/active", active);
router.post("/:id/start", start);

module.exports = router;