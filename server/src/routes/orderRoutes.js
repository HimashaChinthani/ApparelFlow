const express = require("express");
const { createOrder } = require("../controllers/orderController");
const { attachDemoUser, requireRole } = require("../middleware/demoAuth");

const router = express.Router();
router.post("/", attachDemoUser, requireRole("cutting_supervisor"), createOrder);

module.exports = router;