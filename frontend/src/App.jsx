import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})

const statusColors = {
  Safe: '#34d399',
  Suspicious: '#fbbf24',
  Attack: '#fb7185'
}

const cardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

function App() {
  const [logs, setLogs] = useState([])
  const [analyzedRows, setAnalyzedRows] = useState([])
  const [autoDetection, setAutoDetection] = useState(true)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const feedRef = useRef(null)

  const mergedRows = useMemo(() => {
    if (!analyzedRows.length) {
      return logs.map((log) => ({
        log,
        analysis: { status: 'Safe', risk_score: 0, reason: 'Pending analysis' }
      }))
    }
    return analyzedRows
  }, [logs, analyzedRows])

  const summary = useMemo(() => {
    return mergedRows.reduce(
      (acc, row) => {
        acc.total += 1
        if (row.analysis.status !== 'Safe') {
          acc.threats += 1
        }
        if (row.analysis.status === 'Attack') {
          acc.highRiskUsers.add(row.log.user_id)
        }
        return acc
      },
      { total: 0, threats: 0, highRiskUsers: new Set() }
    )
  }, [mergedRows])

  const pieData = useMemo(() => {
    const counts = mergedRows.reduce(
      (acc, row) => {
        acc[row.analysis.status] += 1
        return acc
      },
      { Safe: 0, Suspicious: 0, Attack: 0 }
    )
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [mergedRows])

  const userRiskData = useMemo(() => {
    const riskByUser = {}
    for (const row of mergedRows) {
      riskByUser[row.log.user_id] = (riskByUser[row.log.user_id] || 0) + row.analysis.risk_score
    }
    return Object.entries(riskByUser)
      .map(([user, score]) => ({ user, score: Math.round(score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [mergedRows])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [mergedRows])

  const runAnalysis = useCallback(async () => {
    if (!logs.length) {
      return
    }
    try {
      setAnalyzing(true)
      const { data } = await api.post('/analyze-batch', { logs })
      setAnalyzedRows(data.results)
      if (!selectedLog && data.results.length) {
        setSelectedLog(data.results[0])
      }
    } finally {
      setAnalyzing(false)
    }
  }, [logs, selectedLog])

  useEffect(() => {
    if (!autoDetection || !logs.length) {
      return
    }
    runAnalysis()
  }, [autoDetection, logs, runAnalysis])

  const generateLogs = useCallback(async () => {
    try {
      setLoading(true)
      setSelectedLog(null)
      const { data } = await api.post('/generate-logs', { count: 30 })
      setLogs(data)
      setAnalyzedRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-cyber-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.2),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(244,114,182,0.15),transparent_35%)]" />
      <div className="cyber-grid absolute inset-0 opacity-30 animate-drift" />

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-8">
        <motion.header className="glass p-6 shadow-glow" {...cardMotion}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-cyber text-3xl text-cyan-300">Agentic SOC Prototype</h1>
              <p className="mt-2 text-sm text-slate-300">Cinematic Threat Intelligence Dashboard</p>
            </div>
            <div className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 animate-pulseGlow">
              AI Agent Active
            </div>
          </div>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Logs" value={summary.total} tone="cyan" />
          <StatCard title="Threats Detected" value={summary.threats} tone="amber" />
          <StatCard title="High Risk Users" value={summary.highRiskUsers.size} tone="rose" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
          <motion.div className="glass p-4" {...cardMotion}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-cyber text-lg text-cyan-200">Control Panel</h2>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Auto Detection
                <button
                  onClick={() => setAutoDetection((prev) => !prev)}
                  className={`h-6 w-12 rounded-full p-1 transition ${autoDetection ? 'bg-cyan-400/70' : 'bg-slate-600'}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${autoDetection ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton onClick={generateLogs} loading={loading} text="Generate Logs" />
              <ActionButton onClick={runAnalysis} loading={analyzing} text="Run Analysis" />
            </div>
            <div className="mt-4 grid gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/40 p-3 text-sm">
              <p className="text-cyan-200">Detection Agent: Active</p>
              <p className="text-purple-200">Investigation Agent: Simulated</p>
              <p className="text-emerald-200">Response Agent: Ready</p>
            </div>
          </motion.div>

          <motion.div className="glass p-4" {...cardMotion}>
            <h2 className="mb-3 font-cyber text-lg text-cyan-200">Risk Distribution</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={statusColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <motion.div className="glass overflow-hidden" {...cardMotion}>
            <div className="border-b border-cyan-300/10 px-4 py-3">
              <h2 className="font-cyber text-lg text-cyan-200">Log Analysis Table</h2>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading || analyzing ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse border-b border-slate-800/80">
                        <td className="px-4 py-3"><div className="h-3 rounded bg-slate-700/60" /></td>
                        <td className="px-4 py-3"><div className="h-3 rounded bg-slate-700/60" /></td>
                        <td className="px-4 py-3"><div className="h-3 rounded bg-slate-700/60" /></td>
                        <td className="px-4 py-3"><div className="h-3 rounded bg-slate-700/60" /></td>
                        <td className="px-4 py-3"><div className="h-3 rounded bg-slate-700/60" /></td>
                      </tr>
                    ))
                  ) : mergedRows.map((row, idx) => (
                    <tr
                      key={`${row.log.user_id}-${idx}`}
                      onClick={() => setSelectedLog(row)}
                      className={`cursor-pointer border-b border-slate-800/80 transition hover:bg-cyan-400/5 ${row.analysis.status === 'Attack' ? 'shadow-threat' : ''}`}
                    >
                      <td className="px-4 py-3">{row.log.user_id}</td>
                      <td className="px-4 py-3">{row.log.action}</td>
                      <td className={`px-4 py-3 font-semibold status-${row.analysis.status.toLowerCase()}`}>{row.analysis.status}</td>
                      <td className="px-4 py-3">{Math.round(row.analysis.risk_score)}</td>
                      <td className="px-4 py-3 text-slate-300">{row.analysis.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div className="glass p-4" {...cardMotion}>
            <h2 className="mb-3 font-cyber text-lg text-cyan-200">Explainability Panel</h2>
            {selectedLog ? (
              <div className="space-y-3 text-sm text-slate-300">
                <p><span className="text-cyan-200">User:</span> {selectedLog.log.user_id}</p>
                <p><span className="text-cyan-200">Event:</span> {selectedLog.log.action} from {selectedLog.log.ip_address}</p>
                <p><span className="text-cyan-200">AI Reasoning:</span> {selectedLog.analysis.reason}</p>
                <p className={`font-semibold status-${selectedLog.analysis.status.toLowerCase()}`}>
                  Classification: {selectedLog.analysis.status} ({Math.round(selectedLog.analysis.risk_score)})
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a log event to inspect AI-style reasoning.</p>
            )}
          </motion.div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <motion.div className="glass p-4" {...cardMotion}>
            <h2 className="mb-3 font-cyber text-lg text-cyan-200">Live Threat Feed</h2>
            <div ref={feedRef} className="h-56 overflow-auto rounded-xl border border-cyan-300/15 bg-slate-950/60 p-3 font-mono text-xs">
              {mergedRows.map((row, idx) => (
                <div key={idx} className="mb-2 flex gap-2">
                  <span className="text-slate-500">[{new Date(row.log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`status-${row.analysis.status.toLowerCase()}`}>●</span>
                  <span>{row.log.user_id}</span>
                  <span className="text-slate-400">{row.log.action}</span>
                  <span className={`status-${row.analysis.status.toLowerCase()}`}>{row.analysis.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="glass p-4" {...cardMotion}>
            <h2 className="mb-3 font-cyber text-lg text-cyan-200">User Risk Ranking</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={userRiskData}>
                  <XAxis dataKey="user" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {userRiskData.map((entry, index) => (
                      <Cell key={entry.user} fill={index === 0 ? '#fb7185' : '#22d3ee'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

function StatCard({ title, value, tone }) {
  const toneClasses = {
    cyan: 'from-cyan-400/20 to-cyan-600/10 border-cyan-300/30',
    amber: 'from-amber-400/20 to-amber-600/10 border-amber-300/30',
    rose: 'from-rose-400/20 to-rose-600/10 border-rose-300/30'
  }

  return (
    <motion.div {...cardMotion} className={`glass border bg-gradient-to-br p-4 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{title}</p>
      <p className="mt-2 font-cyber text-3xl text-white">{value}</p>
    </motion.div>
  )
}

function ActionButton({ onClick, text, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-xl border border-cyan-300/40 bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:scale-[1.02] hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Processing...' : text}
    </button>
  )
}

export default App
