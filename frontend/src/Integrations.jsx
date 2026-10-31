import { Blocks, Leaf, Snowflake, Wallet, Code2 } from 'lucide-react'
import { Badge, Card, PageHeader } from './components/ui.jsx'

export default function Integrations({ aiMeta }) {
  const items = [
    { icon: Leaf, name: 'Gemma 4', status: aiMeta.label, detail: 'Google-hosted produce descriptions, photo analysis and explanations grounded in marketplace records. A successful request verifies the current connection.' },
    { icon: Snowflake, name: 'Snowflake CoCo', status: 'Setup required', detail: 'Supply-demand analytics integration and genuine Cortex Code usage evidence remain outstanding.' },
    { icon: Wallet, name: 'Solana Agent Registry', status: 'Setup required', detail: 'Agent registration is not configured. Wallet approval is required before any signing or transaction.' },
    { icon: Code2, name: 'GitHub Copilot', status: 'Evidence required', detail: 'Record actual GitHub Copilot usage for the submission. Codex work is not Copilot evidence.' },
  ]
  return <div className="stack"><PageHeader eyebrow="Connected tools" title="Integrations" subtitle="An honest view of the services behind FreshRoute AI." /><div className="requirement-grid">{items.map(item => <Card key={item.name} className="integration-detail"><item.icon size={30} className="icon-green" /><h2>{item.name}</h2><Badge tone={item.name === 'Gemma 4' ? 'green' : 'orange'}>{item.status}</Badge><p>{item.detail}</p></Card>)}</div></div>
}
