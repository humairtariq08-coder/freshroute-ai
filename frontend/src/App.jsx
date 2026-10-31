import { useEffect, useState, useRef } from 'react'
import AiAssistant from './AiAssistant.jsx'
import Marketplace from './Marketplace.jsx'
import {
  Leaf, Zap, Map, BarChart3, ShieldCheck, Truck, Package,
  Thermometer, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2,
  ArrowRight, Github, Globe, Database, Cpu, ShoppingBag, Home
} from 'lucide-react'

const TECH_STACK = [
  { label: 'React 19', icon: '⚛️' },
  { label: 'Vite 7', icon: '⚡' },
  { label: 'Tailwind v4', icon: '🎨' },
  { label: 'FastAPI', icon: '🚀' },
  { label: 'SQLite', icon: '🗄️' },
  { label: 'Recharts', icon: '📊' },
  { label: 'React Leaflet', icon: '🗺️' },
  { label: 'Lucide React', icon: '✨' },
]

const FEATURES = [
  {
    icon: <Map size={22} />,
    title: 'Real-Time Route Optimization',
    desc: 'AI-driven dynamic routing adapts to traffic, weather, and spoilage risk in real time.',
    color: '#00e87a',
  },
  {
    icon: <Thermometer size={22} />,
    title: 'Cold-Chain Monitoring',
    desc: 'IoT-enabled temperature tracking with predictive spoilage alerts across the supply chain.',
    color: '#00ffd2',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Predictive Demand Analytics',
    desc: 'ML models forecast demand patterns to minimize overstock and food waste.',
    color: '#00d4ff',
  },
  {
    icon: <Truck size={22} />,
    title: 'Fleet Intelligence',
    desc: 'Smart vehicle allocation with capacity planning and driver efficiency scoring.',
    color: '#7c3aed',
  },
]

const STATS = [
  { value: '30%', label: 'Waste Reduction' },
  { value: '45%', label: 'Cost Savings' },
  { value: '2×', label: 'Faster Delivery' },
  { value: '99.9%', label: 'Uptime SLA' },
]

function useHealthCheck() {
  const [health, setHealth] = useState({ state: 'loading', message: 'Checking backend…' })

  useEffect(() => {
    const controller = new AbortController()
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

    fetch(`${base}/api/health`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.status === 'ok') {
          setHealth({ state: 'ok', message: 'Backend connected · SQLite ready', data })
        } else {
          setHealth({ state: 'error', message: 'Backend returned unexpected status' })
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setHealth({ state: 'error', message: 'Backend unavailable — start the API server.' })
        }
      })

    return () => controller.abort()
  }, [])

  return health
}

function StatusIndicator({ health }) {
  const dotClass = health.state === 'ok' ? '' : health.state === 'loading' ? 'loading' : 'error'
  const stateColor = health.state === 'ok' ? '#00e87a' : health.state === 'loading' ? '#ffd166' : '#ff4d6d'

  return (
    <div
      className="status-pill border-pulse"
      style={{ borderColor: `${stateColor}33`, color: stateColor, background: `${stateColor}0d` }}
      role="status"
      aria-live="polite"
    >
      {health.state === 'loading'
        ? <Loader2 size={12} style={{ color: stateColor, animation: 'spin 1s linear infinite' }} />
        : health.state === 'ok'
        ? <CheckCircle size={12} />
        : <AlertCircle size={12} />}
      <span>{health.message}</span>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color, index }) {
  return (
    <div
      className="feature-item fade-in-up"
      style={{ animationDelay: `${0.4 + index * 0.1}s`, opacity: 0 }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}1a`, border: `1px solid ${color}33`, color
        }}
      >
        {icon}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e8f5ee' }}>{title}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b8f7a', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function App() {
  const health = useHealthCheck()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const [view, setView] = useState('home') // 'home' | 'marketplace'

  useEffect(() => {
    const onMove = e => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Background layers */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-mesh" aria-hidden="true" />

      {/* Floating orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* Navigation */}
        <nav
          id="main-nav"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 32px',
            background: 'rgba(5, 13, 10, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 232, 122, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00e87a, #00ffd2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 232, 122, 0.4)',
            }}>
              <Leaf size={18} color="#050d0a" strokeWidth={2.5} />
            </div>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700, fontSize: 17,
              background: 'linear-gradient(135deg, #fff, #a0d4b5)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              FreshRoute AI
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 12, border: '1px solid rgba(0,232,122,0.08)' }}>
            <button
              id="nav-home"
              onClick={() => setView('home')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
                background: view === 'home' ? 'rgba(0,232,122,0.12)' : 'transparent',
                color: view === 'home' ? '#00e87a' : '#6b8f7a',
                boxShadow: view === 'home' ? 'inset 0 0 0 1px rgba(0,232,122,0.28)' : 'none',
              }}
            >
              <Home size={14} /> Overview
            </button>
            <button
              id="nav-marketplace"
              onClick={() => setView('marketplace')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
                background: view === 'marketplace' ? 'rgba(0,232,122,0.12)' : 'transparent',
                color: view === 'marketplace' ? '#00e87a' : '#6b8f7a',
                boxShadow: view === 'marketplace' ? 'inset 0 0 0 1px rgba(0,232,122,0.28)' : 'none',
              }}
            >
              <ShoppingBag size={14} /> Marketplace
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusIndicator health={health} />
          </div>
        </nav>

        {/* Conditional view */}
        {view === 'marketplace' && <Marketplace />}

        {/* Hero Section — only shown on home */}
        {view === 'home' && <section
          ref={heroRef}
          id="hero"
          style={{
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center',
            minHeight: '100vh', padding: '120px 24px 80px',
            overflow: 'hidden',
          }}
        >
          {/* Mouse-tracked radial highlight */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(0,232,122,0.05) 0%, transparent 70%)`,
            transition: 'background 0.1s ease',
          }} aria-hidden="true" />

          {/* Hackathon badge */}
          <div
            className="fade-in-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 50,
              background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.25)',
              marginBottom: 32, fontSize: 13, fontWeight: 600,
              color: '#00e87a', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            <Zap size={14} fill="#00e87a" />
            Hackathon Project · Food Logistics AI
            <Zap size={14} fill="#00e87a" />
          </div>

          {/* Main heading */}
          <h1
            className="fade-in-up"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              fontWeight: 800, lineHeight: 1.05,
              margin: '0 0 8px',
              letterSpacing: '-0.03em',
            }}
          >
            <span style={{ color: '#e8f5ee' }}>Fresh</span>
            <span className="gradient-text">Route</span>
            <span style={{ color: '#e8f5ee' }}> AI</span>
          </h1>

          <p
            className="fade-in-up"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: '#6b8f7a', maxWidth: 560, margin: '16px auto 0',
              lineHeight: 1.7, fontWeight: 400,
            }}
          >
            AI-powered predictive logistics for the food supply chain.
            Reduce waste, optimize routes, and deliver freshness at scale.
          </p>

          {/* CTA */}
          <div
            className="fade-in-up"
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 40 }}
          >
            <button id="cta-docs" className="btn-glow" onClick={() => window.open('http://127.0.0.1:8000/docs', '_blank')}>
              <Globe size={16} />
              API Docs
              <ArrowRight size={16} />
            </button>
            <button
              id="cta-health"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 50,
                background: 'transparent', border: '1px solid rgba(0,232,122,0.3)',
                color: '#a0d4b5', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.3s ease',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
              onClick={() => window.open('http://127.0.0.1:8000/api/health', '_blank')}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(0,232,122,0.7)'; e.target.style.color = '#00e87a'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(0,232,122,0.3)'; e.target.style.color = '#a0d4b5'; }}
            >
              <ShieldCheck size={16} />
              Health Check
            </button>
          </div>

          {/* Stats row */}
          <div
            className="fade-in-up"
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16, marginTop: 64, width: '100%', maxWidth: 700,
            }}
          >
            {STATS.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value" style={{ fontSize: 18 }}>Not measured</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>}

        {/* Main content — only shown on home */}
        {view === 'home' && <main id="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

          <AiAssistant />

          {/* Features grid */}
          <section id="features" aria-labelledby="features-heading">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00e87a', marginBottom: 12 }}>
                Planned Platform Features
              </p>
              <h2
                id="features-heading"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 700, margin: 0, color: '#e8f5ee',
                }}
              >
                Food Logistics Roadmap
              </h2>
            </div>

            <div
              className="glass-card"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, padding: 24 }}
            >
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} {...f} index={i} />
              ))}
            </div>
          </section>

          {/* Tech Stack + API Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24, marginTop: 32,
            }}
          >
            {/* Tech Stack */}
            <section id="tech-stack" className="glass-card" style={{ padding: 28 }} aria-labelledby="tech-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Cpu size={18} color="#00e87a" />
                <h2 id="tech-heading" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f5ee' }}>
                  Technology Stack
                </h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TECH_STACK.map((t, i) => (
                  <span key={i} className="tech-badge">
                    <span aria-hidden="true">{t.icon}</span>
                    {t.label}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#6b8f7a', margin: '16px 0 0', lineHeight: 1.6 }}>
                Full-stack monorepo with React + Vite for the frontend and FastAPI + SQLite for the backend.
                Recharts for analytics, React Leaflet for maps, and Lucide for icons.
              </p>
            </section>

            {/* API Status */}
            <section id="api-status" className="glass-card" style={{ padding: 28 }} aria-labelledby="api-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Database size={18} color="#00e87a" />
                <h2 id="api-heading" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f5ee' }}>
                  API Status
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Backend', endpoint: 'FastAPI · Port 8000', state: health.state },
                  { label: 'Database', endpoint: 'SQLite · freshroute.db', state: health.state === 'ok' ? 'ok' : health.state },
                  { label: 'CORS', endpoint: 'Allowed: localhost:5173', state: 'ok' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(0,232,122,0.03)',
                    border: '1px solid rgba(0,232,122,0.08)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5ee' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: '#6b8f7a', marginTop: 2 }}>{item.endpoint}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={`status-dot ${item.state === 'ok' ? '' : item.state}`} />
                      <span style={{
                        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: item.state === 'ok' ? '#00e87a' : item.state === 'loading' ? '#ffd166' : '#ff4d6d',
                      }}>
                        {item.state === 'ok' ? 'Online' : item.state === 'loading' ? 'Checking' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(0,0,0,0.3)', fontFamily: 'monospace', fontSize: 12,
                color: '#6b8f7a', border: '1px solid rgba(0,232,122,0.06)',
              }}>
                <span style={{ color: '#00e87a' }}>GET</span>{' '}
                <span style={{ color: '#a0d4b5' }}>http://127.0.0.1:8000</span>
                <span style={{ color: '#e8f5ee' }}>/api/health</span>
              </div>
            </section>
          </div>

          {/* Quick start */}
          <section id="quickstart" className="glass-card" style={{ padding: 28, marginTop: 32 }} aria-labelledby="quickstart-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Clock size={18} color="#00e87a" />
              <h2 id="quickstart-heading" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f5ee' }}>
                Quick Start — Windows PowerShell
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                {
                  title: '🔧 Terminal 1 — Backend',
                  code: `cd D:\\Hackathone\\freshroute-ai
.\\.venv\\Scripts\\python.exe \`
  -m uvicorn backend.main:app \`
  --reload --host 127.0.0.1 --port 8000`,
                },
                {
                  title: '🌐 Terminal 2 — Frontend',
                  code: `cd D:\\Hackathone\\freshroute-ai\\frontend
npm.cmd run dev`,
                },
              ].map((block, i) => (
                <div key={i}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#a0d4b5', marginBottom: 8 }}>{block.title}</p>
                  <pre style={{
                    margin: 0, padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,232,122,0.1)',
                    fontFamily: 'monospace', fontSize: 12, color: '#00e87a',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7,
                  }}>
                    <code>{block.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="glass-card" style={{ padding: 28, marginTop: 32 }} aria-labelledby="roadmap-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <TrendingUp size={18} color="#00e87a" />
              <h2 id="roadmap-heading" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8f5ee' }}>
                Development Roadmap
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { prompt: 'Prompt 1', title: 'Project Setup', done: true },
                { prompt: 'Prompt 2', title: 'Data Models & Database Schema', done: false },
                { prompt: 'Prompt 3', title: 'AI Route Optimization Engine', done: false },
                { prompt: 'Prompt 4', title: 'Interactive Map Dashboard', done: false },
                { prompt: 'Prompt 5', title: 'Analytics & Reporting', done: false },
              ].map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                  borderRadius: 12, background: step.done ? 'rgba(0,232,122,0.06)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${step.done ? 'rgba(0,232,122,0.2)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.done ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${step.done ? 'rgba(0,232,122,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    {step.done
                      ? <CheckCircle size={16} color="#00e87a" />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: '#6b8f7a' }}>{i + 1}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: '#6b8f7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {step.prompt}
                    </span>
                    <div style={{ fontSize: 14, color: step.done ? '#e8f5ee' : '#6b8f7a', fontWeight: 500, marginTop: 2 }}>
                      {step.title}
                    </div>
                  </div>
                  {step.done && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#00e87a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Complete
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>}

        {/* Footer */}
        <footer
          id="site-footer"
          style={{
            textAlign: 'center', padding: '24px',
            borderTop: '1px solid rgba(0,232,122,0.06)',
            color: '#6b8f7a', fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <Leaf size={14} color="#00e87a" />
            <span style={{ fontWeight: 600, color: '#a0d4b5' }}>FreshRoute AI</span>
          </div>
          <p style={{ margin: 0 }}>
            MIT License · Hackathon Starter · Foundation ready — logistics features coming next.
          </p>
        </footer>
      </div>
    </>
  )
}
