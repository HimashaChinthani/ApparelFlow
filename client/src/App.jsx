import { useEffect, useState } from 'react'
import './App.css'

const roles = [
  { value: 'cutting_supervisor', label: 'Cutting Supervisor', initials: 'MS' },
  { value: 'cutting_verifier', label: 'Cutting Verifier', initials: 'NP' },
  { value: 'sewing_supervisor', label: 'Sewing Supervisor', initials: 'RS' },
]
const emptyForm = { recipe_id: '', target_qty: '', fabric_roll_id: '', actual_fabric_yds: '' }

function App() {
  const [activeRole, setActiveRole] = useState(roles[0].value)
  const [recipes, setRecipes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const role = roles.find((item) => item.value === activeRole)
  const selectedRecipe = recipes.find((item) => item.id === form.recipe_id)
  const targetQty = Number(form.target_qty)

  useEffect(() => {
    fetch('/api/recipes')
      .then((response) => response.json())
      .then(setRecipes)
      .catch(() => setMessage({ type: 'error', text: 'Could not load recipes. Complete the database setup before creating an order.' }))
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage(null)
  }

  async function submitOrder(event) {
    event.preventDefault()
    if (!Number.isInteger(targetQty) || targetQty <= 0 || !form.recipe_id || !form.fabric_roll_id.trim() || Number(form.actual_fabric_yds) <= 0) {
      setMessage({ type: 'error', text: 'Enter a recipe, positive whole-number batch size, roll ID, and positive fabric usage.' })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': activeRole },
        body: JSON.stringify({ ...form, target_qty: targetQty, actual_fabric_yds: Number(form.actual_fabric_yds) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Order could not be created')
      setOrders((current) => [data, ...current])
      setForm(emptyForm)
      setMessage({ type: 'success', text: `${data.order_no} is ready for verification.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">AF</span><span>ApparelFlow <small>ERP / CUTTING OPERATIONS</small></span></div>
        <div className="role-switcher"><span>Demo identity</span>{roles.map((item) => <button className={item.value === activeRole ? 'role active' : 'role'} key={item.value} onClick={() => setActiveRole(item.value)}><b>{item.initials}</b>{item.label}</button>)}</div>
      </header>
      <section className="workspace-head"><div><p className="eyebrow">Production control</p><h1>Cutting order desk</h1><p className="lede">Prepare accurate production batches before they reach the quality checkpoint.</p></div><div className="status-chip"><span className="pulse" /> {role.label}<small>Authenticated demo session</small></div></section>
      {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}
      {activeRole === 'cutting_supervisor' ? <section className="content-grid">
        <form className="panel order-form" onSubmit={submitOrder}><div className="panel-heading"><div><p className="eyebrow">New production batch</p><h2>Create cutting order</h2></div><span className="step">ORDER INTAKE</span></div>
          <label>Production recipe<select name="recipe_id" value={form.recipe_id} onChange={updateField}><option value="">Select a recipe</option>{recipes.map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.recipe_code} · {recipe.name}</option>)}</select></label>
          {selectedRecipe && <div className="recipe-summary"><div><strong>{selectedRecipe.name}</strong><span>{selectedRecipe.category} · {selectedRecipe.std_fabric_yards} yds / piece</span></div><span className="cap">{selectedRecipe.wastage_cap}% cap</span></div>}
          <div className="field-row"><label>Target batch quantity<input name="target_qty" type="number" min="1" step="1" value={form.target_qty} onChange={updateField} placeholder="e.g. 50" /></label><label>Fabric roll ID<input name="fabric_roll_id" value={form.fabric_roll_id} onChange={updateField} placeholder="FAB-ROLL-882" /></label></div>
          <label>Actual fabric used <span className="label-note">yards</span><input name="actual_fabric_yds" type="number" min="0.01" step="0.01" value={form.actual_fabric_yds} onChange={updateField} placeholder="e.g. 92.4" /></label>
          <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Creating order...' : 'Create order →'}</button>
        </form>
        <aside className="panel multiplier"><div className="panel-heading"><div><p className="eyebrow">Live multiplier</p><h2>Expected cut pieces</h2></div><span className="formula">QTY × PCS</span></div>{selectedRecipe && targetQty > 0 ? <div className="component-list">{selectedRecipe.recipe_components?.map((component) => <div className="component" key={component.id}><span>{component.component_name}</span><strong>{Number(component.pieces_per_garment) * targetQty}<small> pcs</small></strong><em>{component.pieces_per_garment} × {targetQty}</em></div>)}</div> : <div className="empty-state"><span className="empty-icon">×</span><p>Select a recipe and batch quantity to calculate the cut plan.</p></div>}</aside>
      </section> : <section className="panel role-lock"><span className="lock-icon">{role.initials}</span><p className="eyebrow">{role.label} workspace</p><h2>Order creation is restricted</h2><p>This workspace is scoped to the Cutting Supervisor. Switch identity above to test the separated role boundary.</p></section>}
      {orders.length > 0 && <section className="panel recent-orders"><div className="panel-heading"><div><p className="eyebrow">This session</p><h2>Created orders</h2></div><span className="order-count">{orders.length} batch{orders.length === 1 ? '' : 'es'}</span></div><div className="order-table">{orders.map((order) => <div className="order-row" key={order.id}><span className="order-id">{order.order_no}</span><span>{order.recipes?.name || 'Production batch'}</span><span>{order.target_qty} garments</span><span>{order.status.replaceAll('_', ' ')}</span><b>{order.component_counts?.reduce((total, item) => total + item.expected_qty, 0)} pieces</b></div>)}</div></section>}
      <footer><span>APPARELFLOW CONTROL PLANE</span><span>SERVER-VALIDATED ORDER INTAKE</span></footer>
    </main>
  )
}

export default App