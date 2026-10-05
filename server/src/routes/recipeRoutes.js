const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

router.get("/", async (req, res) => {
    console.log("GET /api/recipes called");

    try {
        const { data, error } = await supabase
            .from("recipes")
            .select("*");

        console.log("Data:", data);
        console.log("Error:", error);

        if (error) {
            return res.status(500).json({
                message: error.message
            });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;