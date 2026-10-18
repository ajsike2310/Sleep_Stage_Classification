import { useEffect, useState } from 'react'
import { api, useFetch } from './api'
import { ShortcutsDialog } from './components/help'
import { ErrorNote, Icon, Skeleton } from './components/ui'
import { Model } from './pages/Model'
import { NightExplorer } from './pages/NightExplorer'
import { Overview } from './pages/Overview'
import { Performance } from './pages/Performance'
import { navigate, useRoute } from './router'

const PAGES = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'night', label: 'Night explorer', icon: 'night' },
  { id: 'performance', label: 'Performance', icon: 'chart' },
  { id: 'model', label: 'Model', icon: 'cpu' },
] as const
type PageId = (typeof PAGES)[number]['id']
type Theme = 'system' | 'light' | 'dark'

function readTheme(): Theme {
  try { return (localStorage.getItem('theme') as Theme) || 'system' } catch { return 'system' }
}

export default function App() {
  const route = useRoute()
  const page = (PAGES.find((p) => p.id === route.page)?.id ?? 'overview') as PageId
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [shortcuts, setShortcuts] = useState(false)
  const summary = useFetch('summary', api.summary)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA') setShortcuts(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const label = PAGES.find((p) => p.id === page)?.label ?? 'Overview'
    document.title = `${label}, SleepNet`
  }, [page])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* storage unavailable */ }
  }, [theme])

  const go = (id: string) => navigate(id)
  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
  const themeIcon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'
  const status = summary.error ? 'is-down' : summary.loading ? 'is-wait' : ''
  const m = summary.data?.model
  const split = summary.data?.split

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M25.5 19.2A11 11 0 0 1 12.8 6.5a11 11 0 1 0 12.7 12.7Z" fill="currentColor" />
            <path d="M3 17h5l2.5-4 3.5 8 3-6h3" fill="none" stroke="var(--stage-0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="brand-name">SleepNet</span>
        </div>
        <nav className="nav" aria-label="Pages">
          {PAGES.map((p) => (
            <button key={p.id} aria-current={page === p.id ? 'page' : undefined} onClick={() => go(p.id)}>
              <Icon name={p.icon} />{p.label}
            </button>
          ))}
        </nav>
        <div className="masthead-right">
          <span className="chip"><span className={`status-dot ${status}`} />
            {summary.error ? 'API offline' : summary.loading ? 'Connecting' : 'API online'}</span>
          <button className="icon-btn" onClick={() => setShortcuts(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
            <Icon name="keyboard" />
          </button>
          <button className="icon-btn" onClick={() => setTheme(nextTheme[theme])}
            aria-label={`Theme: ${theme}. Switch to ${nextTheme[theme]}`} title={`Theme: ${theme}`}>
            <Icon name={themeIcon} />
          </button>
        </div>
      </header>

      <main className="content">
        {summary.error && <div className="page"><ErrorNote message={summary.error} /></div>}
        {summary.loading && (
          <div className="page"><Skeleton height={48} /><Skeleton height={92} /><div className="grid g3">{[0, 1, 2].map((i) => <Skeleton key={i} height={300} />)}</div></div>
        )}
        {summary.data && page === 'overview' && <Overview summary={summary.data} onNavigate={go} />}
        {page === 'night' && <NightExplorer key={route.params.get('rec') ?? 'default'} params={route.params} />}
        {summary.data && page === 'performance' && <Performance summary={summary.data} />}
        {summary.data && page === 'model' && <Model summary={summary.data} />}
      </main>

      <footer className="colophon">
        <div className="colophon-inner">
          <span>Sleep-EDF-20 dataset</span>
          <span>Fpz-Cz channel at 100 Hz</span>
          {split && <span>{split.n_subjects} subjects</span>}
          {m && <span>{m.parameters.toLocaleString()} parameters</span>}
          {m && <span>Checkpoint from epoch {m.checkpoint_epoch}</span>}
        </div>
      </footer>
      <ShortcutsDialog open={shortcuts} onClose={() => setShortcuts(false)} />
    </div>
  )
}
