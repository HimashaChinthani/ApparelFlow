const express = require("express");
const { pending, decide } = require("../controllers/verificationController");
const { attachDemoUser, requireRole } = require("../middleware/demoAuth");

const router = express.Router();
router.use(attachDemoUser, requireRole("cutting_verifier"));
router.get("/pending", pending);
router.post("/:id/decision", decide);

module.exports = router;