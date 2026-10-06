const orderService = require("../services/orderService");

const getOrders = async (req, res) => {
    try {
        res.json(await orderService.getOrders(req.user.id));
    } catch (error) {
        console.error("Get cutting orders error:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

const createOrder = async (req, res) => {
    const { recipe_id, target_qty, fabric_roll_id, actual_fabric_yds } = req.body;
    const targetQty = Number(target_qty);
    const actualFabricYds = Number(actual_fabric_yds);

    if (!recipe_id || !fabric_roll_id?.trim() || !Number.isInteger(targetQty) || targetQty <= 0) {
        return res.status(400).json({ message: "recipe_id, fabric_roll_id and a positive whole-number target_qty are required" });
    }
    if (!Number.isFinite(actualFabricYds) || actualFabricYds <= 0) {
        return res.status(400).json({ message: "actual_fabric_yds must be a positive number" });
    }

    try {
        const order = await orderService.createOrder({ recipeId: recipe_id, targetQty, fabricRollId: fabric_roll_id.trim(), actualFabricYds, createdBy: req.user.id });
        res.status(201).json(order);
    } catch (error) {
        console.error("Create cutting order error:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

module.exports = { getOrders, createOrder };