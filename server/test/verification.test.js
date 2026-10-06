const test = require("node:test");
const assert = require("node:assert/strict");
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_KEY = "test-key";
const {
    validateItems,
    canApprove,
    hasRejectionReason,
    getSewingQueue
} = require("../src/services/verificationService");
const { requireRole } = require("../src/middleware/demoAuth");

const order = {
    target_qty: 10,
    recipes: {
        recipe_components: [
            { id: "front", component_name: "Front", pieces_per_garment: 1 },
            { id: "cuffs", component_name: "Cuffs", pieces_per_garment: 2 }
        ]
    }
};

test("all green components can be approved", () => {
    const items = validateItems(order, [
        { component_id: "front", actual_qty: 10 },
        { component_id: "cuffs", actual_qty: 20 }
    ]);
    assert.ok(items.every((item) => item.status === "GREEN"));
    assert.equal(canApprove(items), true);
});

test("a shortage blocks approval", () => {
    const items = validateItems(order, [
        { component_id: "front", actual_qty: 9 },
        { component_id: "cuffs", actual_qty: 20 }
    ]);
    assert.equal(items[0].status, "RED");
    assert.equal(canApprove(items), false);
});

test("rejection requires a non-empty reason", () => {
    assert.equal(hasRejectionReason(""), false);
    assert.equal(hasRejectionReason("   "), false);
    assert.equal(hasRejectionReason("Missing sleeve"), true);
});

test("non-verifier roles are denied by the role guard", () => {
    let status;
    let body;
    requireRole("cutting_verifier")(
        { user: { role: "cutting_supervisor" } },
        { status: (value) => ({ json: (valueBody) => { status = value; body = valueBody; } }) },
        () => { throw new Error("next should not be called"); }
    );
    assert.equal(status, 403);
    assert.match(body.message, /cannot perform/i);
});

test("the sewing queue query filters to verified orders", async () => {
    const calls = [];
    const db = {
        from(table) {
            calls.push(["from", table]);
            return this;
        },
        select(value) { calls.push(["select", value]); return this; },
        eq(field, value) { calls.push(["eq", field, value]); return this; },
        order() { return Promise.resolve({ data: [], error: null }); }
    };
    await getSewingQueue(db);
    assert.deepEqual(calls.find((call) => call[0] === "eq"), ["eq", "status", "VERIFIED"]);
});
