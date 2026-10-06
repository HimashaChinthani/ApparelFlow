require("dotenv").config();

const express = require("express");
const cors = require("cors");

const recipeRoutes = require("./routes/recipeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const sewingRoutes = require("./routes/sewingRoutes");
const { login } = require("./middleware/demoAuth");

const app = express();

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()) : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.post("/api/auth/login", login);

app.use("/api/recipes", recipeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/sewing", sewingRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "ApparelFlow API is running"
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
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

module.exports = app;
