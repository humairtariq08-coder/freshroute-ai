import { useState } from 'react'
import { Loader2, Package, ShoppingBag } from 'lucide-react'
import { API } from '../lib/data'
import { Alert, Field, Modal } from './ui'

const PRODUCT_INITIAL = {
  name: '', category: 'Vegetables', farmer: '', location: 'Karachi',
  price: '', quantity: '', freshness_days: 3, description: '',
  lat: 24.8607, lng: 67.0011,
}

const REQUIREMENT_INITIAL = {
  buyer: '', produce: '', quantity: '', max_price: '', location: 'Karachi',
}

export function ProductFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState(PRODUCT_INITIAL)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const bind = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  })

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          quantity: parseFloat(form.quantity),
          freshness_days: parseInt(form.freshness_days, 10),
          lat: Number(form.lat), lng: Number(form.lng),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Could not create the listing.')
      onSaved(payload)
      onClose()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="List new produce" icon={Package} onClose={onClose}>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={submit} className="form-grid">
        <div className="form-row two">
          <Field label="Produce name"><input className="input" required minLength={2} maxLength={80} placeholder="e.g. Vine tomatoes" {...bind('name')} /></Field>
          <Field label="Category">
            <select className="input" {...bind('category')}>
              {['Vegetables', 'Fruits', 'Leafy greens', 'Grains'].map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
        </div>
        <div className="form-row two">
          <Field label="Farmer / grower"><input className="input" required minLength={2} maxLength={80} placeholder="Farm or grower" {...bind('farmer')} /></Field>
          <Field label="Location"><input className="input" required minLength={2} maxLength={80} placeholder="City / district" {...bind('location')} /></Field>
        </div>
        <div className="form-row three">
          <Field label="Price (PKR/kg)"><input className="input" type="number" min={1} step={0.01} required placeholder="140" {...bind('price')} /></Field>
          <Field label="Quantity (kg)"><input className="input" type="number" min={0.1} step={0.1} required placeholder="500" {...bind('quantity')} /></Field>
          <Field label="Shelf life (days)"><input className="input" type="number" min={1} max={365} required {...bind('freshness_days')} /></Field>
        </div>
        <Field label="Description (optional)" hint="Stored as-is and shown on the listing.">
          <textarea className="input" rows={3} maxLength={2000} placeholder="Brief description of the produce…" {...bind('description')} />
        </Field>
        <div className="form-row two">
          <Field label="Pickup latitude" hint="Default is Karachi; enter your actual pickup coordinates."><input className="input" type="number" min={-90} max={90} step="any" required {...bind('lat')} /></Field>
          <Field label="Pickup longitude"><input className="input" type="number" min={-180} max={180} step="any" required {...bind('lng')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <><Loader2 size={14} className="spinner" /> Saving…</> : <><Package size={14} /> List produce</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function RequirementFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState(REQUIREMENT_INITIAL)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const bind = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  })

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity),
          max_price: parseFloat(form.max_price),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Could not post the requirement.')
      onSaved(payload)
      onClose()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Post buying requirement" icon={ShoppingBag} onClose={onClose}>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={submit} className="form-grid">
        <div className="form-row two">
          <Field label="Buyer / business"><input className="input" required minLength={2} maxLength={80} placeholder="Business name" {...bind('buyer')} /></Field>
          <Field label="Produce needed"><input className="input" required minLength={2} maxLength={80} placeholder="e.g. tomatoes" {...bind('produce')} /></Field>
        </div>
        <div className="form-row three">
          <Field label="Quantity (kg)"><input className="input" type="number" min={0.1} step={0.1} required placeholder="200" {...bind('quantity')} /></Field>
          <Field label="Max price (PKR/kg)"><input className="input" type="number" min={1} step={0.01} required placeholder="160" {...bind('max_price')} /></Field>
          <Field label="Location"><input className="input" required minLength={2} maxLength={80} placeholder="City" {...bind('location')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <><Loader2 size={14} className="spinner" /> Posting…</> : <><ShoppingBag size={14} /> Post requirement</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}
