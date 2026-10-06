require("dotenv").config();

const express = require("express");
const cors = require("cors");

const recipeRoutes = require("./routes/recipeRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/recipes", recipeRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "ApparelFlow API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const supabase = require("./config/supabase");

app.get("/api/test-supabase", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("recipes")
            .select("*");

        if (error) {
            return res.status(500).json({
                connected: false,
                message: error.message
            });
        }

        res.json({
            connected: true,
            message: "Supabase connected successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            connected: false,
            message: error.message
        });
    }
});

