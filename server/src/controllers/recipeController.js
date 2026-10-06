const recipeService = require("../services/recipeService");


// GET ALL RECIPES
const getRecipes = async (req, res) => {
    try {
        const recipes = await recipeService.getAllRecipes();

        res.status(200).json(recipes);

    } catch (error) {
        console.error("Get recipes error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// GET ONE RECIPE
const getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;

        const recipe = await recipeService.getRecipeById(id);

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }

        res.status(200).json(recipe);

    } catch (error) {
        console.error("Get recipe error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// CREATE RECIPE
const createRecipe = async (req, res) => {
    try {
        const {
            recipe_code,
            name,
            category,
            std_fabric_yards,
            wastage_cap
        } = req.body;

        if (!recipe_code || !name || !category) {
            return res.status(400).json({
                message: "recipe_code, name and category are required"
            });
        }

        const recipe = await recipeService.createRecipe({
            recipe_code,
            name,
            category,
            std_fabric_yards,
            wastage_cap
        });

        res.status(201).json(recipe);

    } catch (error) {
        console.error("Create recipe error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE RECIPE
const updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            recipe_code,
            name,
            category,
            std_fabric_yards,
            wastage_cap
        } = req.body;

        const recipe = await recipeService.updateRecipe(id, {
            recipe_code,
            name,
            category,
            std_fabric_yards,
            wastage_cap
        });

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }

        res.status(200).json(recipe);

    } catch (error) {
        console.error("Update recipe error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE RECIPE
const deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;

        const recipe = await recipeService.deleteRecipe(id);

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            message: "Recipe deleted successfully",
            recipe
        });

    } catch (error) {
        console.error("Delete recipe error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe
};