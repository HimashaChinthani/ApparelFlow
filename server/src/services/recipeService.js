const supabase = require("../config/supabase");


// GET ALL RECIPES
const getAllRecipes = async () => {

    const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_components(id, component_name, pieces_per_garment)");

    if (error) {
        throw new Error(error.message);
    }

    return data;
};


// GET RECIPE BY ID
const getRecipeById = async (id) => {

    const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_components(id, component_name, pieces_per_garment)")
        .eq("id", id)
        .single();

    if (error) {

        // PGRST116 = no rows found
        if (error.code === "PGRST116") {
            return null;
        }

        throw new Error(error.message);
    }

    return data;
};


// CREATE RECIPE
const createRecipe = async (recipeData) => {

    const { data, error } = await supabase
        .from("recipes")
        .insert([recipeData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};


// UPDATE RECIPE
const updateRecipe = async (id, recipeData) => {

    const { data, error } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq("id", id)
        .select()
        .single();

    if (error) {

        if (error.code === "PGRST116") {
            return null;
        }

        throw new Error(error.message);
    }

    return data;
};


// DELETE RECIPE
const deleteRecipe = async (id) => {

    const { data, error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {

        if (error.code === "PGRST116") {
            return null;
        }

        throw new Error(error.message);
    }

    return data;
};


module.exports = {
    getAllRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe
};