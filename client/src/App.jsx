import { useEffect, useState } from 'react'
import './App.css'

const roles = [
  { value: 'cutting_supervisor', label: 'Cutting Supervisor', initials: 'MS' },
  { value: 'cutting_verifier', label: 'Cutting Verifier', initials: 'NP' },
  { value: 'sewing_supervisor', label: 'Sewing Supervisor', initials: 'RS' },
]
const emptyForm = { recipe_id: '', target_qty: '', fabric_roll_id: '', actual_fabric_yds: '' }
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const apiUrl = (path) => `${API_URL}${path}`

function App() {
  const [activeRole, setActiveRole] = useState(roles[0].value)
  const [recipes, setRecipes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [orders, setOrders] = useState([])
  const [pending, setPending] = useState([])
  const [selectedPendingId, setSelectedPendingId] = useState('')
  const [queue, setQueue] = useState([])
  const [activeSewing, setActiveSewing] = useState([])
  const [counts, setCounts] = useState({})
  const [rejectionNote, setRejectionNote] = useState('')
  const [message, setMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [authenticatedRole, setAuthenticatedRole] = useState('')
  const [loginRole, setLoginRole] = useState(activeRole)
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const role = roles.find((item) => item.value === activeRole)
  const selectedRecipe = recipes.find((item) => item.id === form.recipe_id)
  const availableRecipes = recipes.filter((recipe) => recipe.recipe_components?.length)
  const targetQty = Number(form.target_qty)
  const selectedOrder = pending.find((order) => order.id === selectedPendingId) || pending[0]
  const selectedComponents = selectedOrder?.recipes?.recipe_components || []

  useEffect(() => {
    fetch(apiUrl('/api/recipes')).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not load recipes')
      return data
    }).then(setRecipes).catch((error) => setMessage({ type: 'error', text: error.message || 'Could not load recipes. Complete the database setup first.' }))
  }, [])

  async function signIn(event) {
    event?.preventDefault()
    setIsLoggingIn(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: loginRole, password: loginPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Authentication failed')
      setActiveRole(loginRole)
      setAuthToken(data.token)
      setAuthenticatedRole(loginRole)
      setLoginPassword('')
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoggingIn(false)
    }
  }

  useEffect(() => {
    if (!authToken || authenticatedRole !== activeRole) return
    const authHeaders = { Authorization: `Bearer ${authToken}` }
    if (activeRole === 'cutting_supervisor') {
      fetch(apiUrl('/api/orders'), { headers: authHeaders }).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load cutting orders')
        return data
      }).then(setOrders).catch((error) => setMessage({ type: 'error', text: error.message }))
    }
    if (activeRole === 'cutting_verifier') {
      fetch(apiUrl('/api/verification/pending'), { headers: authHeaders }).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load pending batches')
        return data
      }).then((data) => { setPending(data); setSelectedPendingId(data[0]?.id || '') }).catch((error) => setMessage({ type: 'error', text: error.message }))
    }
    if (activeRole === 'sewing_supervisor') {
      fetch(apiUrl('/api/sewing/queue'), { headers: authHeaders }).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load sewing queue')
        return data
      }).then(setQueue).catch((error) => setMessage({ type: 'error', text: error.message }))
      fetch(apiUrl('/api/sewing/active'), { headers: authHeaders }).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load active sewing batches')
        return data
      }).then(setActiveSewing).catch((error) => setMessage({ type: 'error', text: error.message }))
    }
  }, [activeRole, authToken, authenticatedRole])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage(null)
  }

  function switchRole(nextRole) {
    setLoginRole(nextRole)
    setLoginPassword('')
    setAuthToken('')
    setAuthenticatedRole('')
  }

  function signOut() {
    setAuthToken('')
    setAuthenticatedRole('')
    setLoginRole(activeRole)
    setLoginPassword('')
    setMessage({ type: 'success', text: 'You have been signed out.' })
  }

  if (!authToken) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div className="brand"><span className="brand-mark">AF</span><span>ApparelFlow <small>ERP / CUTTING OPERATIONS</small></span></div>
          <span className="status-chip">Secure demo login</span>
        </header>
        <section className="workspace-head">
          <div><p className="eyebrow">Production control</p><h1>Sign in to ApparelFlow</h1><p className="lede">Choose a factory role to access its protected workflow workspace.</p></div>
        </section>
        {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}
        <form className="panel login-panel" onSubmit={signIn}>
          <div className="panel-heading"><div><p className="eyebrow">Demo credentials</p><h2>Authenticated access</h2></div><span className="step">RBAC SESSION</span></div>
          <label>Factory role<select value={loginRole} onChange={(event) => setLoginRole(event.target.value)}>{roles.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          <label>Demo password<input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Enter demo" autoComplete="current-password" required /></label>
          <p className="login-help">Demo password: <strong>demo</strong></p>
          <button className="primary-button" type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Signing in...' : 'Sign in securely →'}</button>
        </form>
        <footer><span>APPARELFLOW CONTROL PLANE</span><span>SIGNED SESSION REQUIRED</span></footer>
      </main>
    )
  }

  async function submitOrder(event) {
    event.preventDefault()
    if (!Number.isInteger(targetQty) || targetQty <= 0 || !form.recipe_id || !form.fabric_roll_id.trim() || Number(form.actual_fabric_yds) <= 0) {
      setMessage({ type: 'error', text: 'Enter a recipe, positive whole-number batch size, roll ID, and positive fabric usage.' })
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch(apiUrl('/api/orders'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ ...form, target_qty: targetQty, actual_fabric_yds: Number(form.actual_fabric_yds) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Order could not be created')
      setOrders((current) => [data, ...current])
      setForm(emptyForm)
      setMessage({ type: 'success', text: `${data.order_no} is ready for verification.` })
    } catch (error) { setMessage({ type: 'error', text: error.message }) } finally { setIsSaving(false) }
  }

  function updateCount(componentId, value) {
    setCounts((current) => ({ ...current, [componentId]: value }))
  }

  function itemStatus(component) {
    const expected = Number(component.pieces_per_garment) * Number(selectedOrder?.target_qty)
    const actual = Number(counts[component.id])
    if (!Number.isInteger(actual) || actual < 0) return 'UNCHECKED'
    return actual < expected ? 'RED' : actual > expected ? 'YELLOW' : 'GREEN'
  }

  async function submitDecision(decision) {
    if (!selectedOrder) return
    if (decision === 'REJECTED' && !rejectionNote.trim()) { setMessage({ type: 'error', text: 'A rejection reason is required.' }); return }
    const items = selectedComponents.map((component) => ({ component_id: component.id, actual_qty: Number(counts[component.id]) }))
    setIsSaving(true)
    try {
      const response = await fetch(apiUrl(`/api/verification/${selectedOrder.id}/decision`), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ decision, rejection_note: rejectionNote, items }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Verification could not be recorded')
      const remainingOrders = pending.filter((order) => order.id !== selectedOrder.id)
      setPending(remainingOrders)
      setSelectedPendingId(remainingOrders[0]?.id || '')
      setCounts({})
      setRejectionNote('')
      setMessage({ type: 'success', text: `${selectedOrder.order_no} marked ${data.status.replaceAll('_', ' ').toLowerCase()}.` })
    } catch (error) { setMessage({ type: 'error', text: error.message }) } finally { setIsSaving(false) }
  }

  async function startSewing(order) {
    setIsSaving(true)
    try {
      const response = await fetch(apiUrl(`/api/sewing/${order.id}/start`), { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not start sewing')
      setQueue((current) => current.filter((item) => item.id !== order.id))
      const activeResponse = await fetch(apiUrl('/api/sewing/active'), { headers: { Authorization: `Bearer ${authToken}` } })
      const activeData = await activeResponse.json()
      if (!activeResponse.ok) throw new Error(activeData.message || 'Could not load active sewing batches')
      setActiveSewing(activeData)
      setMessage({ type: 'success', text: `${order.order_no} released to sewing assembly.` })
    } catch (error) { setMessage({ type: 'error', text: error.message }) } finally { setIsSaving(false) }
  }

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark">AF</span><span>ApparelFlow <small>ERP / CUTTING OPERATIONS</small></span></div><div className="role-switcher"><span>Demo identity</span>{roles.map((item) => <button className={item.value === activeRole ? 'role active' : 'role'} key={item.value} onClick={() => switchRole(item.value)}><b>{item.initials}</b>{item.label}</button>)}<button className="logout-button" onClick={signOut}>Log out</button></div></header>
      <section className="workspace-head"><div><p className="eyebrow">Production control</p><h1>{activeRole === 'cutting_verifier' ? 'Verification station' : activeRole === 'sewing_supervisor' ? 'Sewing queue' : 'Cutting order desk'}</h1><p className="lede">{activeRole === 'cutting_verifier' ? 'Count every component before a batch is released to assembly.' : activeRole === 'sewing_supervisor' ? 'Release verified production batches to the assembly floor.' : 'Prepare accurate production batches before they reach the quality checkpoint.'}</p></div><div className="status-chip"><span className="pulse" /> {role.label}<small>Authenticated demo session</small></div></section>
      {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}

      {activeRole === 'cutting_supervisor' && <section className="content-grid"><form className="panel order-form" onSubmit={submitOrder}><div className="panel-heading"><div><p className="eyebrow">New production batch</p><h2>Create cutting order</h2></div><span className="step">ORDER INTAKE</span></div><label>Production recipe<select name="recipe_id" value={form.recipe_id} onChange={updateField}><option value="">Select a recipe</option>{availableRecipes.map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.recipe_code} · {recipe.name}</option>)}</select></label>{selectedRecipe && <div className="recipe-summary"><div><strong>{selectedRecipe.name}</strong><span>{selectedRecipe.category} · {selectedRecipe.std_fabric_yards} yds / piece</span></div><span className="cap">{selectedRecipe.wastage_cap}% cap</span></div>}<div className="field-row"><label>Target batch quantity<input name="target_qty" type="number" min="1" step="1" value={form.target_qty} onChange={updateField} placeholder="e.g. 50" /></label><label>Fabric roll ID<input name="fabric_roll_id" value={form.fabric_roll_id} onChange={updateField} placeholder="FAB-ROLL-882" /></label></div><label>Actual fabric used <span className="label-note">yards</span><input name="actual_fabric_yds" type="number" min="0.01" step="0.01" value={form.actual_fabric_yds} onChange={updateField} placeholder="e.g. 92.4" /></label><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Creating order...' : 'Create order →'}</button></form><aside className="panel multiplier"><div className="panel-heading"><div><p className="eyebrow">Live multiplier</p><h2>Expected cut pieces</h2></div><span className="formula">QTY × PCS</span></div>{selectedRecipe && targetQty > 0 ? <div className="component-list">{selectedRecipe.recipe_components?.map((component) => <div className="component" key={component.id}><span>{component.component_name}</span><strong>{Number(component.pieces_per_garment) * targetQty}<small> pcs</small></strong><em>{component.pieces_per_garment} × {targetQty}</em></div>)}</div> : <div className="empty-state"><span className="empty-icon">×</span><p>Select a recipe and batch quantity to calculate the cut plan.</p></div>}</aside></section>}

      {activeRole === 'cutting_verifier' && <section className="panel verifier-panel"><div className="panel-heading"><div><p className="eyebrow">Quality checkpoint</p><h2>{selectedOrder ? selectedOrder.order_no : 'No pending batches'}</h2></div>{selectedOrder && <span className="order-count">{pending.length} pending · {selectedOrder.recipes.name}</span>}</div>{selectedOrder ? <><div className="pending-orders"><span className="pending-label">Pending batches</span>{pending.map((order) => <button className={order.id === selectedOrder.id ? 'pending-order active' : 'pending-order'} key={order.id} onClick={() => { setSelectedPendingId(order.id); setCounts({}); setRejectionNote('') }}><strong>{order.order_no}</strong><span>{order.recipes.name} · {order.target_qty} garments</span></button>)}</div><div className="verification-list">{selectedComponents.map((component) => <div className={`verification-row ${itemStatus(component).toLowerCase()}`} key={component.id}><div><strong>{component.component_name}</strong><span>Expected {Number(component.pieces_per_garment) * Number(selectedOrder.target_qty)} pieces</span></div><input aria-label={`Actual ${component.component_name}`} type="number" min="0" step="1" value={counts[component.id] ?? ''} onChange={(event) => updateCount(component.id, event.target.value)} placeholder="Actual count" /><b>{itemStatus(component)}</b></div>)}</div><label className="rejection-field">Rejection note <span className="label-note">required only when rejecting</span><textarea value={rejectionNote} onChange={(event) => setRejectionNote(event.target.value)} placeholder="Describe any shortage or defect..." /></label><div className="decision-actions"><button className="secondary-button reject" disabled={isSaving} onClick={() => submitDecision('REJECTED')}>Reject batch</button><button className="primary-button" disabled={isSaving || selectedComponents.some((component) => itemStatus(component) === 'RED' || itemStatus(component) === 'UNCHECKED')} onClick={() => submitDecision('APPROVED')}>Approve batch →</button></div></> : <div className="empty-state light"><span className="empty-icon">✓</span><p>All cutting batches have been reviewed.</p></div>}</section>}

      {activeRole === 'sewing_supervisor' && <><section className="panel queue-panel"><div className="panel-heading"><div><p className="eyebrow">Assembly release</p><h2>Verified sewing queue</h2></div><span className="order-count">{queue.length} ready</span></div>{queue.length ? <div className="queue-list">{queue.map((order) => { const audit = order.verification_logs?.[0]; return <div className="queue-row" key={order.id}><div><strong>{order.order_no}</strong><span>{order.recipes?.name} · {order.target_qty} garments</span><small>Roll {order.fabric_roll_id} · {Number(order.actual_fabric_yds).toFixed(2)} yds used · Wastage {Number(audit?.wastage_pct || 0).toFixed(2)}%</small><small>{order.verification_items?.length || 0} component counts verified by {audit?.verifier_id || 'assigned verifier'}</small></div><button className="primary-button compact" disabled={isSaving} onClick={() => startSewing(order)}>Start sewing →</button></div> })}</div> : <div className="empty-state light"><span className="empty-icon">—</span><p>No verified batches are waiting for assembly.</p></div>}</section><section className="panel active-sewing-panel"><div className="panel-heading"><div><p className="eyebrow">Assembly floor</p><h2>Sewing in progress</h2></div><span className="order-count">{activeSewing.length} active</span></div>{activeSewing.length ? <div className="queue-list">{activeSewing.map((order) => <div className="queue-row active-sewing-row" key={order.id}><div><strong>{order.order_no}</strong><span>{order.recipes?.name} · {order.target_qty} garments</span><small>Roll {order.fabric_roll_id} · Status: SEWING IN PROGRESS</small></div><b className="sewing-status">IN PROGRESS</b></div>)}</div> : <div className="empty-state light"><span className="empty-icon">—</span><p>No batches have started sewing yet.</p></div>}</section></>}

      {orders.length > 0 && activeRole === 'cutting_supervisor' && <section className="panel recent-orders"><div className="panel-heading"><div><p className="eyebrow">Persistent production history</p><h2>Created orders</h2></div><span className="order-count">{orders.length} batch{orders.length === 1 ? '' : 'es'}</span></div><div className="order-table">{orders.map((order) => <div className="order-row" key={order.id}><span className="order-id">{order.order_no}</span><span>{order.recipes?.name || 'Production batch'}</span><span>{order.target_qty} garments</span><span>{order.status.replaceAll('_', ' ')}</span><b>{order.verification_items?.length ? `${order.verification_items.reduce((total, item) => total + item.expected_qty, 0)} pieces` : `${Number(order.expected_fabric_yds).toFixed(2)} yds expected`}</b></div>)}</div></section>}
      <footer><span>APPARELFLOW CONTROL PLANE</span><span>SERVER-VALIDATED WORKFLOW</span></footer>
    </main>
  )
}

export default App