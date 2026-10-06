const supabase = require("../config/supabase");

const getPendingOrders = async () => {
    const { data, error } = await supabase
        .from("cutting_orders")
        .select("id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, expected_fabric_yds, status, created_at, recipes(recipe_code, name, recipe_components(id, component_name, pieces_per_garment))")
        .eq("status", "PENDING_VERIFICATION")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

const getSewingQueue = async (db = supabase) => {
    const { data, error } = await db
        .from("cutting_orders")
        .select("id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, expected_fabric_yds, status, created_at, recipes(recipe_code, name), verification_items(component_id, expected_qty, actual_qty, status), verification_logs(verifier_id, decision, rejection_note, wastage_pct, created_at)")
        .eq("status", "VERIFIED")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

const getActiveSewing = async () => {
    const { data, error } = await supabase
        .from("cutting_orders")
        .select("id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, expected_fabric_yds, status, updated_at, recipes(recipe_code, name), verification_items(component_id, expected_qty, actual_qty, status), verification_logs(verifier_id, decision, rejection_note, wastage_pct, created_at)")
        .eq("status", "SEWING_IN_PROGRESS")
        .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

const validateItems = (order, items) => {
    const components = order.recipes?.recipe_components || [];
    if (!Array.isArray(items) || items.length !== components.length) {
        throw Object.assign(new Error("Every recipe component must be counted"), { status: 422 });
    }

    const itemMap = new Map();
    for (const item of items) {
        if (!item?.component_id || itemMap.has(item.component_id)) {
            throw Object.assign(new Error("Each recipe component must be counted exactly once"), { status: 422 });
        }
        itemMap.set(item.component_id, Number(item.actual_qty));
    }
    return components.map((component) => {
        const actualQty = itemMap.get(component.id);
        if (!Number.isInteger(actualQty) || actualQty < 0) {
            throw Object.assign(new Error(`Enter a non-negative whole-number count for ${component.component_name}`), { status: 422 });
        }
        const expectedQty = Number(component.pieces_per_garment) * Number(order.target_qty);
        return { component_id: component.id, component_name: component.component_name, expected_qty: expectedQty, actual_qty: actualQty, status: actualQty < expectedQty ? "RED" : actualQty > expectedQty ? "YELLOW" : "GREEN" };
    });
};

const canApprove = (items) => items.length > 0 && items.every((item) => item.status !== "RED");
const hasRejectionReason = (note) => typeof note === "string" && note.trim().length > 0;

const recordDecision = async ({ orderId, verifierId, decision, rejectionNote, items }) => {
    const { data: order, error: orderError } = await supabase
        .from("cutting_orders")
        .select("id, target_qty, actual_fabric_yds, expected_fabric_yds, status, recipes(recipe_components(id, component_name, pieces_per_garment))")
        .eq("id", orderId)
        .eq("status", "PENDING_VERIFICATION")
        .single();
    if (orderError || !order) throw Object.assign(new Error("Pending cutting order not found"), { status: 404 });

    const validatedItems = validateItems(order, items);
    if (decision === "APPROVED" && !canApprove(validatedItems)) {
        throw Object.assign(new Error("Approval blocked: one or more components have a shortage"), { status: 422 });
    }
    if (decision === "REJECTED" && !hasRejectionReason(rejectionNote)) {
        throw Object.assign(new Error("A rejection reason is required"), { status: 400 });
    }

    const nextStatus = decision === "APPROVED" ? "VERIFIED" : "REJECTED";
    const wastagePct = ((Number(order.actual_fabric_yds) - Number(order.expected_fabric_yds)) / Number(order.expected_fabric_yds)) * 100;
    const { error: itemsError } = await supabase.from("verification_items").insert(validatedItems.map((item) => ({ order_id: orderId, component_id: item.component_id, expected_qty: item.expected_qty, actual_qty: item.actual_qty, status: item.status })));
    if (itemsError) throw new Error(itemsError.message);
    const { error: updateError } = await supabase.from("cutting_orders").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", orderId).eq("status", "PENDING_VERIFICATION");
    if (updateError) throw new Error(updateError.message);
    const { data: log, error: logError } = await supabase.from("verification_logs").insert([{ order_id: orderId, verifier_id: verifierId, decision, rejection_note: rejectionNote?.trim() || null, wastage_pct: wastagePct }]).select().single();
    if (logError) throw new Error(logError.message);
    return { status: nextStatus, items: validatedItems, log };
};

const startSewing = async (orderId) => {
    const { data: order, error: lookupError } = await supabase
        .from("cutting_orders")
        .select("id, status")
        .eq("id", orderId)
        .single();
    if (lookupError || !order) {
        throw Object.assign(new Error("Order not found"), { status: 404 });
    }
    if (order.status !== "VERIFIED") {
        throw Object.assign(new Error(`Only verified orders can start sewing (current status: ${order.status})`), { status: 422 });
    }

    const { data, error } = await supabase
        .from("cutting_orders")
        .update({ status: "SEWING_IN_PROGRESS", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("status", "VERIFIED")
        .select()
        .single();
    if (error) {
        console.error("Start sewing update error:", error);
        throw Object.assign(new Error(error.message), { status: 500 });
    }
    if (!data) throw Object.assign(new Error("Only verified orders can start sewing"), { status: 422 });
    return data;
};

module.exports = { getPendingOrders, getSewingQueue, getActiveSewing, recordDecision, startSewing, validateItems, canApprove, hasRejectionReason };