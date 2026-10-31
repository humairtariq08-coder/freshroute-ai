import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'

export function Card({ children, className = '', ...rest }) {
  return <section className={`card ${className}`.trim()} {...rest}>{children}</section>
}

export function CardHead({ icon: Icon, title, subtitle, actions }) {
  return (
    <div className="card-head">
      <div>
        <div className="card-title">
          {Icon ? <Icon size={16} className="icon-green" /> : null}
          {title}
        </div>
        {subtitle ? <div className="card-sub">{subtitle}</div> : null}
      </div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </div>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'green' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon tone-${tone}`}><Icon size={21} /></div>
      <div className="stat-copy">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub ? <div className="stat-sub">{sub}</div> : null}
      </div>
    </article>
  )
}

export function Badge({ tone = 'green', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon ? <Icon size={34} className="empty-icon" /> : null}
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="loading-row">
      <Loader2 size={20} className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function ToastStack({ toasts, dismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type === 'error'
            ? <AlertCircle size={16} className="toast-icon-error" />
            : <CheckCircle2 size={16} className="toast-icon-ok" />}
          <span>{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss"><X size={13} /></button>
        </div>
      ))}
    </div>
  )
}

export function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{Icon ? <Icon size={19} className="icon-green" /> : null}{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Alert({ tone = 'red', children }) {
  return <div className={`alert ${tone}`} role="alert">{children}</div>
}

export function Disclaimer({ children }) {
  return <div className="disclaimer"><AlertCircle size={14} />{children}</div>
}
