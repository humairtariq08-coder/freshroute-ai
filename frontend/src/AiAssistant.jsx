import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowUp, ImagePlus, Leaf, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import { API, aiStatusMeta } from './lib/data.js'

const prompts = [
  ['description', 'Write a produce description', 'Write a short listing description for an available product.'],
  ['forecast', 'Explain demand', 'Explain our demand forecast and how it compares with current supply.'],
  ['matching', 'Find buyer matches', 'Which farmer and buyer pairs are a good match, and why?'],
  ['logistics', 'Plan deliveries', 'What should I consider when planning pickups and deliveries?'],
]

function MessageText({ text }) {
  return text.split('\n').map((line, index) => <div key={index} style={{ minHeight: line ? undefined : 12 }}>{line.replace(/^\* /, '• ').split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => part.startsWith('**') && part.endsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part)}</div>)
}

export default function AiAssistant({ data, seed }) {
  const [status, setStatus] = useState({ status: 'CHECKING' })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef(null)
  const fileInput = useRef(null)
  const meta = aiStatusMeta(status)

  async function refresh() {
    try {
      const response = await fetch(`${API}/api/ai/status`)
      if (!response.ok) throw new Error()
      setStatus(await response.json())
    } catch { setStatus({ status: 'UNAVAILABLE' }) }
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (seed) setInput(seed.data?.buyer_question || prompts.find(([task]) => task === seed.task)?.[2] || '')
  }, [seed])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages, busy])

  function selectPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3000000) {
      setError('Choose a JPEG, PNG or WebP photo under 3 MB.'); event.target.value = ''; return
    }
    const reader = new FileReader()
    reader.onload = () => { setPhoto({ name: file.name, preview: reader.result, image_base64: String(reader.result).split(',')[1], image_mime: file.type }); setError('') }
    reader.onerror = () => setError('The photo could not be opened.')
    reader.readAsDataURL(file)
  }

  async function send(event) {
    event.preventDefault()
    if (busy || (!input.trim() && !photo)) return
    const text = input.trim() || 'Describe this produce photo.'
    const attached = photo
    setMessages(current => [...current, { role: 'user', text, preview: attached?.preview }])
    setInput(''); setPhoto(null); setBusy(true); setError('')
    try {
      const body = attached
        ? { task: 'photo', data: { question: text }, image_base64: attached.image_base64, image_mime: attached.image_mime }
        : { task: 'chat', data: { message: text, conversation: messages.slice(-8).map(message => ({ role: message.role, text: message.text })) } }
      const response = await fetch(`${API}/api/ai/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) })
      const result = await response.json()
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'The assistant could not complete that request.')
      if (!result.text) throw new Error('The model returned no response. Please retry.')
      setMessages(current => [...current, { role: 'assistant', text: result.text, model: result.model }])
      setStatus({ status: 'CONNECTED', supports_images: true, model: result.model })
    } catch (caught) {
      setError(caught.name === 'TimeoutError' ? 'Gemma took too long to respond. Please try again.' : caught.message)
      setInput(text)
      setStatus(current => ({ ...current, status: 'UNAVAILABLE' }))
    } finally { setBusy(false) }
  }

  return <section className="chat-workspace" aria-label="AI assistant">
    <header className="chat-top"><div className="chat-brand"><span className="chat-symbol"><Sparkles size={23} /></span><div><h1>FreshRoute Assistant</h1><p>Your produce and logistics assistant</p></div></div><div className="chat-status"><span className={`status-pill ${meta.tone}`}>{meta.label}</span><button className="icon-btn" aria-label="Refresh AI status" onClick={refresh}><RefreshCw size={15} /></button></div></header>
    <div className="chat-conversation" role="log" aria-live="polite">
      {!messages.length && <div className="chat-welcome"><div className="chat-welcome-icon"><Leaf size={34} /></div><span className="page-eyebrow">A little intelligence. A fresher future.</span><h2>What can we grow together?</h2><p>Ask about your produce, discover buyer matches, or make sense of demand. I’ll use your marketplace records automatically.</p><div className="chat-suggestions">{prompts.map(([task, label, prompt]) => <button key={task} onClick={() => setInput(prompt)}><Sparkles size={15} /><span>{label}</span><ArrowUp size={14} /></button>)}</div></div>}
      {messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span className="chat-avatar">{message.role === 'assistant' ? <Sparkles size={17} /> : 'You'}</span><div className="chat-message-body"><span className="chat-speaker">{message.role === 'assistant' ? 'FreshRoute AI' : 'You'}</span>{message.preview && <img className="chat-photo" src={message.preview} alt="Attached produce" />}<div className="chat-text"><MessageText text={message.text} /></div>{message.model && <small>{message.model} · Review recommendations before acting.</small>}</div></div>)}
      {busy && <div className="chat-thinking" role="status"><Loader2 className="spinner" size={17} /> Gemma is reviewing your request…</div>}
      <div ref={end} />
    </div>
    <div className="chat-bottom">{error && <div className="alert" role="alert"><AlertCircle size={15} /> {error}</div>}{photo && <div className="chat-attachment"><ImagePlus size={15} />{photo.name}<button className="icon-btn" aria-label="Remove photo" onClick={() => setPhoto(null)}><X size={14} /></button></div>}<form className="chat-composer" onSubmit={send}><textarea aria-label="Message FreshRoute assistant" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about your produce, buyers, demand or delivery plans…" maxLength={2000} rows={2} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(event) } }} /><div className="chat-composer-tools"><div><input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} /><button type="button" className="icon-btn" disabled={!status.supports_images || busy} onClick={() => fileInput.current?.click()} aria-label="Attach produce photo"><ImagePlus size={19} /></button><span>{data?.products?.length || 0} listings connected · Demo catalog included</span></div><button className="chat-send" type="submit" disabled={busy || (!input.trim() && !photo)} aria-label="Send message">{busy ? <Loader2 size={18} className="spinner" /> : <ArrowUp size={19} />}</button></div></form><p className="chat-disclaimer">Powered by hosted Gemma 4. Photo analysis cannot certify food safety.</p></div>
  </section>
}
