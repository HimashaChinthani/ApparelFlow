const supabase = require("../config/supabase");

const getOrders = async (createdBy) => {
    let query = supabase
        .from("cutting_orders")
        .select("id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, expected_fabric_yds, status, created_at, updated_at, recipes(recipe_code, name), verification_items(expected_qty, actual_qty, status)")
        .order("created_at", { ascending: false });

    if (createdBy) query = query.eq("created_by", createdBy);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

const createOrder = async ({ recipeId, targetQty, fabricRollId, actualFabricYds, createdBy }) => {
    const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select("id, recipe_code, name, std_fabric_yards, recipe_components(id, component_name, pieces_per_garment)")
        .eq("id", recipeId)
        .single();

    if (recipeError || !recipe) throw Object.assign(new Error(recipeError?.message || "Recipe not found"), { status: 404 });
    if (!recipe.recipe_components?.length) throw Object.assign(new Error("Selected recipe has no components"), { status: 422 });

    const orderNo = `CUT-${Date.now().toString().slice(-8)}`;
    const expectedFabricYds = Number(recipe.std_fabric_yards) * targetQty;
    const componentCounts = recipe.recipe_components.map((component) => ({
        component_id: component.id,
        component_name: component.component_name,
        pieces_per_garment: Number(component.pieces_per_garment),
        expected_qty: Number(component.pieces_per_garment) * targetQty
    }));

    const { data: order, error } = await supabase.from("cutting_orders").insert([{
        order_no: orderNo, recipe_id: recipe.id, target_qty: targetQty, fabric_roll_id: fabricRollId,
        actual_fabric_yds: actualFabricYds, expected_fabric_yds: expectedFabricYds,
        status: "PENDING_VERIFICATION", created_by: createdBy
    }]).select("*, recipes(recipe_code, name)").single();

    if (error) throw new Error(error.message);
    return { ...order, component_counts: componentCounts };
};

module.exports = { getOrders, createOrder };