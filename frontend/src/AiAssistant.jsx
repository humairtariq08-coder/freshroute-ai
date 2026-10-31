import { useEffect, useState } from 'react'
import { AlertCircle, Sparkles } from 'lucide-react'

const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const fieldStyle = { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #315343', background: '#0a1912', color: '#e8f5ee', marginTop: 8 }

export default function AiAssistant() {
  const [connection, setConnection] = useState({ status: 'CHECKING', message: 'Checking hosted AI configuration…' })
  const [task, setTask] = useState('description')
  const [data, setData] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)
  const requiredKeys = { description: 'produce', forecast: 'forecast', matching: 'listings and requirements', logistics: 'routes and demand' }

  async function selectPhoto(event) {
    setPhoto(null)
    setError('')
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3_000_000) {
      setError('Choose a JPEG, PNG, or WebP image no larger than 3 MB.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhoto({ image_base64: String(reader.result).split(',')[1], image_mime: file.type })
    reader.onerror = () => setError('Could not read the selected image.')
    reader.readAsDataURL(file)
  }

  async function checkConnection(signal) {
    try {
      const response = await fetch(`${base}/api/ai/status`, { signal })
      if (!response.ok) throw new Error('Unable to check AI connection. Start the backend and retry.')
      setConnection(await response.json())
    } catch (err) {
      if (err.name !== 'AbortError') setConnection({ status: 'UNAVAILABLE', message: err.message })
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    checkConnection(controller.signal)
    return () => controller.abort()
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setAnswer(null)
    let parsed
    try {
      parsed = task === 'photo' ? {} : JSON.parse(data)
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' || (task !== 'photo' && !Object.keys(parsed).length)) throw new Error()
    } catch {
      setError('Enter a non-empty JSON object containing your actual produce, forecast, supply/demand, or route data.')
      return
    }
    if (task === 'photo' && !photo) { setError('Select a produce photo first.'); return }
    setBusy(true)
    try {
      const response = await fetch(`${base}/api/ai/assist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, data: parsed, ...(task === 'photo' ? photo : {}) }), signal: AbortSignal.timeout(45000),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'The API rejected this request. Check your data and AI configuration.')
      if (!result.text) throw new Error('The model returned no text. No recommendation was generated.')
      setAnswer(result)
      setConnection({ status: 'CONNECTED', model: result.model, supports_images: true, message: 'Last hosted request succeeded.' })
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'The hosted model timed out. Retry later.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="ai-assistant" className="glass-card" style={{ padding: 28, marginBottom: 32 }} aria-labelledby="ai-heading">
      <h2 id="ai-heading" style={{ color: '#e8f5ee', display: 'flex', gap: 10, alignItems: 'center', fontSize: 20 }}><Sparkles size={22} color="#00e87a" /> AI assistant</h2>
      <div role="status" aria-live="polite" style={{ color: '#a0d4b5', margin: '16px 0' }}>
        <strong>{connection.status}</strong>{connection.model ? ` · ${connection.model}` : ''}
        <p style={{ margin: '6px 0' }}>{connection.message}</p>
      </div>
      <button type="button" onClick={() => checkConnection()} style={{ color: '#00e87a', background: 'transparent', border: '1px solid #315343', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Refresh AI status</button>
      <p style={{ color: '#a0d4b5', lineHeight: 1.6 }}>Use actual records for grounded recommendations. Responses come from the configured hosted model; no sample AI answers are displayed.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        <label style={{ color: '#e8f5ee' }}>Task
          <select value={task} onChange={event => setTask(event.target.value)} style={fieldStyle}>
            <option value="description">Produce listing description</option>
            <option value="forecast">Explain demand forecast</option>
            <option value="matching">Farmer-to-buyer recommendations</option>
            <option value="logistics">Route and demand recommendations</option>
            {connection.supports_images && <option value="photo">Analyze produce photo</option>}
          </select>
        </label>
        {task === 'photo' ? <label style={{ color: '#e8f5ee' }}>Produce photo (JPEG, PNG, WebP; maximum 3 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} style={fieldStyle} required />
        </label> : <label style={{ color: '#e8f5ee' }}>Your actual data (JSON)
          <textarea required value={data} onChange={event => setData(event.target.value)} rows={7} maxLength={24000} style={{ ...fieldStyle, fontFamily: 'monospace', resize: 'vertical' }} aria-describedby="data-help" />
        </label>}
        <p id="data-help" style={{ margin: 0, color: '#a0d4b5', fontSize: 13 }}>{task === 'photo' ? 'Photo analysis describes visible details only; it cannot certify food safety.' : `Required JSON keys: ${requiredKeys[task]}. Supply actual records, not invented values.`} Do not include credentials or private personal information.</p>
        <button className="btn-glow" disabled={busy} type="submit" style={{ justifySelf: 'start', opacity: busy ? 0.6 : 1 }}>{busy ? 'Waiting for hosted model…' : 'Generate with Gemma'}</button>
      </form>
      {error && <p role="alert" style={{ color: '#ff8298', display: 'flex', gap: 8, marginTop: 20 }}><AlertCircle size={18} />{error}</p>}
      {answer && <div aria-live="polite" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#e8f5ee', marginTop: 24, lineHeight: 1.7 }}><p style={{ color: '#a0d4b5', fontSize: 12 }}>Generated by {answer.model}. Review before acting.</p>{answer.text}</div>}
    </section>
  )
}
