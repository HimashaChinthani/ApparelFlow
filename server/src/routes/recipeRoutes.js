const express = require("express");
const { attachDemoUser, requireRole } = require("../middleware/demoAuth");
const {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require("../controllers/recipeController");

const router = express.Router();

router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", attachDemoUser, requireRole("cutting_supervisor"), createRecipe);
router.put("/:id", attachDemoUser, requireRole("cutting_supervisor"), updateRecipe);
router.delete("/:id", attachDemoUser, requireRole("cutting_supervisor"), deleteRecipe);

module.exports = router;