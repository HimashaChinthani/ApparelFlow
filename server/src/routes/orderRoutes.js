const express = require("express");
const { getOrders, createOrder } = require("../controllers/orderController");
const { attachDemoUser, requireRole } = require("../middleware/demoAuth");

const router = express.Router();
router.post("/", attachDemoUser, requireRole("cutting_supervisor"), createOrder);
router.get("/", attachDemoUser, requireRole("cutting_supervisor"), getOrders);

module.exports = router;