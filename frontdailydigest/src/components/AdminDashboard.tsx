import { useState, useEffect } from 'react'
import {
  FiLogOut,
  FiUsers,
  FiMail,
  FiActivity,
  FiAlertTriangle,
  FiRefreshCw,
  FiPlay,
  FiGlobe,
  FiDatabase,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPlus,
  FiTrash2,
  FiBookmark,
  FiX,
  FiEdit2,
  FiSave,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiMenu,
} from 'react-icons/fi'
import {
  HiOutlineSparkles,
  HiOutlineCpuChip,
} from 'react-icons/hi2'
import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa'
import './AdminDashboard.css'
import { API_URL } from '../config'

type AdminSection = 'dashboard' | 'users' | 'themes' | 'sources' | 'digests' | 'scraping' | 'curated' | 'calendar' | 'post-detail' | 'ai-usage'

interface Stats {
  total_users: number
  active_users: number
  total_themes: number
  total_sources: number
  total_articles: number
  total_digests: number
  total_scrape_jobs: number
  pending_users: number
  total_tokens: number
  total_ai_calls: number
}

interface AIUsageData {
  total_tokens: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_calls: number
  today_tokens: number
  today_calls: number
  week_tokens: number
  week_calls: number
  daily_token_limit: number
  daily_request_limit: number
  today_token_pct: number
  today_calls_pct: number
  by_feature: { feature: string; calls: number; tokens: number }[]
  logs: {
    id: number
    feature: string
    model: string
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    user_email: string | null
    created_at: string
  }[]
}

interface RecentUser {
  id: number
  username: string
  email: string
  is_active: boolean
  date_joined: string
  theme_count: number
}

interface ThemeItem {
  id: number
  name: string
  user_email: string
  keywords: string[]
  is_active: boolean
  sources_count: number
  articles_last_digest: number
  last_digest_sent: string | null
  created_at: string
}

interface SourceItem {
  id: number
  name: string
  url: string
  source_type: string
  themes_count: number
  articles_count: number
  last_scraped: string | null
  success_count: number
  error_count: number
}

interface DigestItem {
  id: number
  user_email: string
  theme_name: string
  status: string
  articles_count: number
  created_at: string
  sent_at: string | null
}

interface ScrapeJobItem {
  id: number
  source_name: string
  status: string
  articles_found: number
  articles_added: number
  started_at: string
  completed_at: string | null
  error_message: string
}

interface CuratedSourceItem {
  id: number
  name: string
  url: string
  source_type: string
  description: string
  tags: string[]
  is_active: boolean
  priority: number
}

interface CalendarDay {
  day: number
  date_label: string
  posts: CalendarPost[]
}

interface CalendarPost {
  id: number
  platform: string
  post_type: string
  text: string
  status: string
  hashtags: string[]
  cta: string
  image_url: string | null
}

interface PostDetail {
  id: number
  day: number
  date_label: string
  month: number
  platform: string
  post_type: string
  text: string
  hashtags: string[]
  image_description: string
  cta: string
  objective: string
  status: string
  scheduled_date: string | null
  published_at: string | null
  image_url: string | null
}

interface PostsStats {
  total: number
  by_status: Record<string, number>
  by_platform: Record<string, number>
  by_type: Record<string, number>
}

interface PipelineStatus {
  id: number
  status: string
  current_step: string
  current_step_label: string
  started_at: string
  completed_at: string | null
  total_sources: number
  scraped_sources: number
  total_articles_found: number
  total_articles_new: number
  total_themes: number
  processed_themes: number
  total_digests_created: number
  steps_log: { step: string; label: string; detail: string; time: string }[]
  error_message: string
}

export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<RecentUser[]>([])
  const [themes, setThemes] = useState<ThemeItem[]>([])
  const [sources, setSources] = useState<SourceItem[]>([])
  const [digests, setDigests] = useState<DigestItem[]>([])
  const [scrapeJobs, setScrapeJobs] = useState<ScrapeJobItem[]>([])
  const [curatedSources, setCuratedSources] = useState<CuratedSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineMsg, setPipelineMsg] = useState('')
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  const [pipelinePolling, setPipelinePolling] = useState(false)

  // Curated source form
  const [showCuratedForm, setShowCuratedForm] = useState(false)
  const [curatedForm, setCuratedForm] = useState({
    name: '', url: '', source_type: 'rss', description: '', tags: '', priority: 0,
  })
  const [curatedError, setCuratedError] = useState('')

  // Communication / Calendar
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [calendarMonth, setCalendarMonth] = useState(1)
  const [postsStats, setPostsStats] = useState<PostsStats | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingStatus, setEditingStatus] = useState('')
  const [aiUsage, setAiUsage] = useState<AIUsageData | null>(null)

  const token = localStorage.getItem('access_token')

  const fetchApi = async (endpoint: string) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  useEffect(() => {
    if (!token) {
      window.location.hash = '#/auth'
      return
    }
    fetch(`${API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (!data.is_admin) {
          window.location.hash = '#/home'
          return
        }
        loadSection('dashboard')
      })
      .catch(() => {
        localStorage.clear()
        window.location.hash = '#/auth'
      })
  }, [token])

  const loadSection = async (sec: AdminSection) => {
    setSection(sec)
    setLoading(true)
    try {
      switch (sec) {
        case 'dashboard': {
          const [s, u] = await Promise.all([
            fetchApi('/admin/stats/'),
            fetchApi('/admin/users/'),
          ])
          setStats(s)
          setUsers(u)
          break
        }
        case 'users': {
          const u = await fetchApi('/admin/users/')
          setUsers(u)
          break
        }
        case 'themes': {
          const t = await fetchApi('/admin/themes/')
          setThemes(t)
          break
        }
        case 'sources': {
          const s = await fetchApi('/admin/sources/')
          setSources(s)
          break
        }
        case 'digests': {
          const d = await fetchApi('/admin/digests/')
          setDigests(d)
          break
        }
        case 'scraping': {
          const [j, ps] = await Promise.all([
            fetchApi('/admin/scrape-jobs/'),
            fetchApi('/admin/pipeline-status/'),
          ])
          setScrapeJobs(j)
          if (ps && ps.id) {
            setPipelineStatus(ps)
            if (ps.status === 'running') {
              setPipelineRunning(true)
              startPolling(ps.id)
            }
          }
          break
        }
        case 'curated': {
          const c = await fetchApi('/admin/curated-sources/')
          setCuratedSources(c)
          break
        }
        case 'ai-usage': {
          const ai = await fetchApi('/admin/ai-usage/')
          setAiUsage(ai)
          break
        }
        case 'calendar': {
          const [cal, st] = await Promise.all([
            fetchApi(`/communication/posts/calendar/?month=${calendarMonth}`),
            fetchApi('/communication/posts/stats/'),
          ])
          setCalendarDays(cal)
          setPostsStats(st)
          break
        }
        case 'post-detail': {
          // Charge via openPostDetail
          break
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const openPostDetail = async (postId: number) => {
    setLoading(true)
    try {
      const p = await fetchApi(`/communication/posts/${postId}/`)
      setSelectedPost(p)
      setEditingText(p.text)
      setEditingStatus(p.status)
      setSection('post-detail')
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleUpdatePost = async () => {
    if (!selectedPost) return
    try {
      await fetch(`${API_URL}/communication/posts/${selectedPost.id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: editingText, status: editingStatus }),
      })
      setSelectedPost({ ...selectedPost, text: editingText, status: editingStatus })
    } catch { /* ignore */ }
  }

  const handleBulkValidate = async (dayPosts: CalendarPost[]) => {
    const ids = dayPosts.filter(p => p.status === 'brouillon').map(p => p.id)
    if (ids.length === 0) return
    try {
      await fetch(`${API_URL}/communication/posts/bulk/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'valide', ids }),
      })
      loadSection('calendar')
    } catch { /* ignore */ }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPost || !e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('image', e.target.files[0])
    try {
      const res = await fetch(`${API_URL}/communication/posts/${selectedPost.id}/upload-image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedPost({ ...selectedPost, image_url: data.image_url })
      }
    } catch { /* ignore */ }
  }

  const handleDeleteImage = async () => {
    if (!selectedPost) return
    try {
      await fetch(`${API_URL}/communication/posts/${selectedPost.id}/delete-image/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedPost({ ...selectedPost, image_url: null })
    } catch { /* ignore */ }
  }

  const handleCopyText = () => {
    if (!selectedPost) return
    const fullText = selectedPost.text + '\n\n' + selectedPost.hashtags.join(' ')
    navigator.clipboard.writeText(fullText)
    setCopyMsg('Texte copie !')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const [copyMsg, setCopyMsg] = useState('')

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    fetch(`${API_URL}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).finally(() => {
      localStorage.clear()
      window.location.hash = '#/auth'
    })
  }

  const handleRunPipeline = async (force = false) => {
    setPipelineRunning(true)
    setPipelineMsg(force ? 'Lancement (mode force)...' : 'Lancement...')
    setPipelineStatus(null)
    setSection('scraping')
    setLoading(false)
    try {
      const res = await fetch(`${API_URL}/admin/run-pipeline/${force ? '?force=true' : ''}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.run_id) {
        // Fetch immediatement le status puis poll
        const status = await fetchApi(`/admin/pipeline-status/${data.run_id}/`)
        setPipelineStatus(status)
        if (status.status === 'running') {
          startPolling(data.run_id)
        } else {
          // Deja termine (rapide)
          setPipelineRunning(false)
          setPipelineMsg(status.status === 'completed' ? 'Pipeline termine !' : 'Pipeline echoue.')
        }
      } else {
        setPipelineMsg(data.message || data.error || 'Erreur')
        setPipelineRunning(false)
      }
      fetchApi('/admin/scrape-jobs/').then(setScrapeJobs).catch(() => {})
    } catch {
      setPipelineMsg('Erreur lors du lancement')
      setPipelineRunning(false)
    }
  }

  const startPolling = (runId: number) => {
    setPipelinePolling(true)
    const interval = setInterval(async () => {
      try {
        const data = await fetchApi(`/admin/pipeline-status/${runId}/`)
        setPipelineStatus(data)
        if (data.status !== 'running') {
          clearInterval(interval)
          setPipelinePolling(false)
          setPipelineRunning(false)
          setPipelineMsg(data.status === 'completed' ? 'Pipeline termine !' : 'Pipeline echoue.')
          // Refresh les scrape jobs
          fetchApi('/admin/scrape-jobs/').then(setScrapeJobs).catch(() => {})
        }
      } catch {
        clearInterval(interval)
        setPipelinePolling(false)
        setPipelineRunning(false)
      }
    }, 2000)
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // CRUD curated sources
  const handleAddCurated = async () => {
    setCuratedError('')
    const { name, url, source_type, description, tags, priority } = curatedForm
    if (!name.trim() || !url.trim()) {
      setCuratedError('Nom et URL requis.')
      return
    }
    try {
      const res = await fetch(`${API_URL}/admin/curated-sources/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          source_type,
          description: description.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          priority,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCuratedError(data.error || 'Erreur.'); return }
      setCuratedForm({ name: '', url: '', source_type: 'rss', description: '', tags: '', priority: 0 })
      setShowCuratedForm(false)
      loadSection('curated')
    } catch { setCuratedError('Erreur serveur.') }
  }

  const handleDeleteCurated = async (id: number) => {
    try {
      await fetch(`${API_URL}/admin/curated-sources/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      loadSection('curated')
    } catch { /* ignore */ }
  }

  const handleToggleCurated = async (id: number, isActive: boolean) => {
    try {
      await fetch(`${API_URL}/admin/curated-sources/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !isActive }),
      })
      loadSection('curated')
    } catch { /* ignore */ }
  }

  const adminNavItems: { key: AdminSection; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <FiActivity />, label: 'Dashboard' },
    { key: 'users', icon: <FiUsers />, label: 'Utilisateurs' },
    { key: 'themes', icon: <HiOutlineSparkles />, label: 'Themes' },
    { key: 'sources', icon: <FiGlobe />, label: 'Sources' },
    { key: 'digests', icon: <FiMail />, label: 'Digests' },
    { key: 'scraping', icon: <HiOutlineCpuChip />, label: 'Scraping' },
    { key: 'curated', icon: <FiBookmark />, label: 'Base curatee' },
    { key: 'ai-usage', icon: <HiOutlineCpuChip />, label: 'Usage IA' },
  ]

  const comNavItems: { key: AdminSection; icon: React.ReactNode; label: string }[] = [
    { key: 'calendar', icon: <FiCalendar />, label: 'Calendrier' },
  ]

  if (loading && !stats && users.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  return (
    <>
      {/* MOBILE TOPBAR */}
      <div className="admin-mobile-topbar">
        <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <a href="#/admin" className="logo">
          <img src="/logo.png" alt="DailyDigest" className="logo-img" />
          DailyDigest
        </a>
      </div>
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="admin-page">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <a href="#/admin" className="logo">
          <img src="/logo.png" alt="DailyDigest" className="logo-img" />
          DailyDigest
        </a>
        <div className="admin-badge">Admin</div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-group-label">DailyDigest Admin</div>
          {adminNavItems.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${section === item.key ? 'active' : ''}`}
              onClick={() => { loadSection(item.key); setSidebarOpen(false); }}
            >
              {item.icon} {item.label}
            </button>
          ))}

          <div className="admin-nav-divider" />

          <div className="admin-nav-group-label">DailyDigest Communication</div>
          {comNavItems.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${section === item.key ? 'active' : ''}`}
              onClick={() => { loadSection(item.key); setSidebarOpen(false); }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <FiLogOut /> Deconnexion
        </button>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* ══ DASHBOARD ══ */}
        {section === 'dashboard' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Dashboard</h1>
                <p>Vue d'ensemble de DailyDigest</p>
              </div>
              <div className="admin-header-actions">
                <button
                  className="admin-pipeline-btn"
                  onClick={() => handleRunPipeline(false)}
                  disabled={pipelineRunning}
                >
                  {pipelineRunning ? <FiRefreshCw className="admin-spin-icon" /> : <FiPlay />}
                  {pipelineRunning ? 'Pipeline en cours...' : 'Lancer le pipeline'}
                </button>
                <button
                  className="admin-pipeline-btn admin-force-btn"
                  onClick={() => handleRunPipeline(true)}
                  disabled={pipelineRunning}
                  title="Ignore les cooldowns et re-genere tous les digests"
                >
                  <FiRefreshCw /> Forcer
                </button>
                <button className="admin-refresh-btn" onClick={() => loadSection('dashboard')}>
                  <FiRefreshCw /> Actualiser
                </button>
              </div>
            </div>

            {pipelineMsg && (
              <div className="admin-alert">
                <FiCheckCircle /> {pipelineMsg}
              </div>
            )}

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(160,84,42,0.1)', color: 'var(--brown-btn)' }}>
                  <FiUsers size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_users ?? 0}</div>
                  <div className="admin-stat-label">Utilisateurs</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(45,122,79,0.1)', color: '#2d7a4f' }}>
                  <FiCheckCircle size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.active_users ?? 0}</div>
                  <div className="admin-stat-label">Actifs</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  <HiOutlineSparkles size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_themes ?? 0}</div>
                  <div className="admin-stat-label">Themes</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  <FiGlobe size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_sources ?? 0}</div>
                  <div className="admin-stat-label">Sources</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>
                  <FiDatabase size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_articles ?? 0}</div>
                  <div className="admin-stat-label">Articles scrapes</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                  <FiMail size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_digests ?? 0}</div>
                  <div className="admin-stat-label">Digests generes</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                  <HiOutlineCpuChip size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.total_scrape_jobs ?? 0}</div>
                  <div className="admin-stat-label">Scrapes reussis</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <FiAlertTriangle size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats?.pending_users ?? 0}</div>
                  <div className="admin-stat-label">En attente</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                  <HiOutlineCpuChip size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{(stats?.total_tokens ?? 0).toLocaleString()}</div>
                  <div className="admin-stat-label">Tokens IA</div>
                </div>
              </div>
            </div>

            {/* Recent users table */}
            <div className="admin-section">
              <h2>Derniers utilisateurs</h2>
              {renderUsersTable(users.slice(0, 10))}
            </div>
          </>
        )}

        {/* ══ USERS ══ */}
        {section === 'users' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Utilisateurs</h1>
                <p>{users.length} utilisateurs inscrits</p>
              </div>
              <button className="admin-refresh-btn" onClick={() => loadSection('users')}>
                <FiRefreshCw /> Actualiser
              </button>
            </div>
            {renderUsersTable(users)}
          </>
        )}

        {/* ══ THEMES ══ */}
        {section === 'themes' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Themes</h1>
                <p>{themes.length} themes configures</p>
              </div>
              <button className="admin-refresh-btn" onClick={() => loadSection('themes')}>
                <FiRefreshCw /> Actualiser
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Theme</th>
                    <th>Utilisateur</th>
                    <th>Mots-cles</th>
                    <th>Sources</th>
                    <th>Dernier digest</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {themes.length === 0 ? (
                    <tr><td colSpan={6} className="admin-table-empty">Aucun theme.</td></tr>
                  ) : themes.map((t) => (
                    <tr key={t.id}>
                      <td className="admin-cell-bold">{t.name}</td>
                      <td>{t.user_email}</td>
                      <td>
                        <div className="admin-keywords">
                          {t.keywords.slice(0, 4).map((k, i) => (
                            <span key={i} className="admin-keyword-pill">{k}</span>
                          ))}
                          {t.keywords.length > 4 && (
                            <span className="admin-keyword-more">+{t.keywords.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td>{t.sources_count}</td>
                      <td>
                        {t.last_digest_sent
                          ? <span className="admin-date">{formatDate(t.last_digest_sent)}</span>
                          : <span className="admin-muted">Jamais</span>
                        }
                      </td>
                      <td>
                        <span className={`admin-status ${t.is_active ? 'admin-status--active' : 'admin-status--pending'}`}>
                          {t.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ SOURCES ══ */}
        {section === 'sources' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Sources</h1>
                <p>{sources.length} sources actives</p>
              </div>
              <button className="admin-refresh-btn" onClick={() => loadSection('sources')}>
                <FiRefreshCw /> Actualiser
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Themes</th>
                    <th>Articles</th>
                    <th>Dernier scrape</th>
                    <th>Succes / Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.length === 0 ? (
                    <tr><td colSpan={6} className="admin-table-empty">Aucune source.</td></tr>
                  ) : sources.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="admin-cell-bold">{s.name}</div>
                        <div className="admin-cell-sub">{s.url}</div>
                      </td>
                      <td>
                        <span className={`admin-type-badge admin-type--${s.source_type}`}>
                          {s.source_type.toUpperCase()}
                        </span>
                      </td>
                      <td>{s.themes_count}</td>
                      <td>{s.articles_count}</td>
                      <td>
                        {s.last_scraped
                          ? <span className="admin-date">{formatDate(s.last_scraped)}</span>
                          : <span className="admin-muted">Jamais</span>
                        }
                      </td>
                      <td>
                        <span className="admin-score-good">{s.success_count}</span>
                        {' / '}
                        <span className="admin-score-bad">{s.error_count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ DIGESTS ══ */}
        {section === 'digests' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Digests</h1>
                <p>{digests.length} digests generes</p>
              </div>
              <button className="admin-refresh-btn" onClick={() => loadSection('digests')}>
                <FiRefreshCw /> Actualiser
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Theme</th>
                    <th>Articles</th>
                    <th>Statut</th>
                    <th>Cree le</th>
                  </tr>
                </thead>
                <tbody>
                  {digests.length === 0 ? (
                    <tr><td colSpan={5} className="admin-table-empty">Aucun digest.</td></tr>
                  ) : digests.map((d) => (
                    <tr key={d.id}>
                      <td>{d.user_email}</td>
                      <td className="admin-cell-bold">{d.theme_name}</td>
                      <td>{d.articles_count}</td>
                      <td>
                        <span className={`admin-status admin-status--${d.status}`}>
                          {d.status === 'ready' ? 'Pret' :
                           d.status === 'sent' ? 'Envoye' :
                           d.status === 'generating' ? 'En cours' :
                           d.status === 'failed' ? 'Echoue' : d.status}
                        </span>
                      </td>
                      <td><span className="admin-date">{formatDate(d.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ SCRAPING / PIPELINE ══ */}
        {section === 'scraping' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Pipeline & Scraping</h1>
                <p>Lancement et suivi du pipeline en temps reel</p>
              </div>
              <div className="admin-header-actions">
                <button
                  className="admin-pipeline-btn"
                  onClick={() => handleRunPipeline(false)}
                  disabled={pipelineRunning}
                >
                  {pipelineRunning ? <FiRefreshCw className="admin-spin-icon" /> : <FiPlay />}
                  {pipelineRunning ? 'Pipeline en cours...' : 'Lancer le pipeline'}
                </button>
                <button
                  className="admin-pipeline-btn admin-force-btn"
                  onClick={() => handleRunPipeline(true)}
                  disabled={pipelineRunning}
                  title="Ignore les cooldowns et re-genere tous les digests"
                >
                  <FiRefreshCw /> Forcer
                </button>
                <button className="admin-refresh-btn" onClick={() => loadSection('scraping')}>
                  <FiRefreshCw /> Actualiser
                </button>
              </div>
            </div>

            {pipelineMsg && !pipelineStatus && (
              <div className="admin-alert">
                <FiCheckCircle /> {pipelineMsg}
              </div>
            )}

            {/* ── PIPELINE MONITOR ── */}
            {pipelineStatus && (
              <div className="pipeline-monitor">
                <div className="pipeline-monitor-header">
                  <div className="pipeline-monitor-title">
                    {pipelineStatus.status === 'running' && <FiRefreshCw className="admin-spin-icon" />}
                    {pipelineStatus.status === 'completed' && <FiCheckCircle style={{ color: '#2d7a4f' }} />}
                    {pipelineStatus.status === 'failed' && <FiXCircle style={{ color: '#ef4444' }} />}
                    <span>
                      {pipelineStatus.status === 'running' ? 'Pipeline en cours...' :
                       pipelineStatus.status === 'completed' ? 'Pipeline termine' : 'Pipeline echoue'}
                    </span>
                  </div>
                  <span className="pipeline-monitor-time">
                    Demarre {formatDate(pipelineStatus.started_at)}
                  </span>
                </div>

                {/* Etape courante */}
                <div className="pipeline-current-step">
                  {pipelineStatus.current_step_label}
                </div>

                {/* Barres de progression */}
                <div className="pipeline-progress-grid">
                  <div className="pipeline-progress-item">
                    <div className="pipeline-progress-label">
                      <FiGlobe size={14} />
                      <span>Sources</span>
                      <span className="pipeline-progress-count">
                        {pipelineStatus.scraped_sources} / {pipelineStatus.total_sources}
                      </span>
                    </div>
                    <div className="pipeline-progress-bar">
                      <div
                        className="pipeline-progress-fill pipeline-progress-fill--blue"
                        style={{ width: pipelineStatus.total_sources > 0 ? `${(pipelineStatus.scraped_sources / pipelineStatus.total_sources) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="pipeline-progress-item">
                    <div className="pipeline-progress-label">
                      <HiOutlineSparkles size={14} />
                      <span>Themes</span>
                      <span className="pipeline-progress-count">
                        {pipelineStatus.processed_themes} / {pipelineStatus.total_themes}
                      </span>
                    </div>
                    <div className="pipeline-progress-bar">
                      <div
                        className="pipeline-progress-fill pipeline-progress-fill--purple"
                        style={{ width: pipelineStatus.total_themes > 0 ? `${(pipelineStatus.processed_themes / pipelineStatus.total_themes) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Compteurs */}
                <div className="pipeline-counters">
                  <div className="pipeline-counter">
                    <span className="pipeline-counter-value">{pipelineStatus.total_articles_found}</span>
                    <span className="pipeline-counter-label">Articles trouves</span>
                  </div>
                  <div className="pipeline-counter">
                    <span className="pipeline-counter-value">{pipelineStatus.total_articles_new}</span>
                    <span className="pipeline-counter-label">Nouveaux</span>
                  </div>
                  <div className="pipeline-counter">
                    <span className="pipeline-counter-value">{pipelineStatus.total_digests_created}</span>
                    <span className="pipeline-counter-label">Digests crees</span>
                  </div>
                </div>

                {/* Logs */}
                <div className="pipeline-logs">
                  <h4>Journal d'execution</h4>
                  <div className="pipeline-logs-list">
                    {[...pipelineStatus.steps_log].reverse().map((log, i) => (
                      <div key={i} className={`pipeline-log-item pipeline-log--${log.step}`}>
                        <span className="pipeline-log-time">
                          {new Date(log.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="pipeline-log-label">{log.label}</span>
                        {log.detail && <span className="pipeline-log-detail">{log.detail}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {pipelineStatus.error_message && (
                  <div className="pipeline-error">
                    <FiAlertTriangle size={14} /> {pipelineStatus.error_message}
                  </div>
                )}
              </div>
            )}

            {/* Historique scrape jobs */}
            <div className="admin-section" style={{ marginTop: 24 }}>
              <h2>Historique des scrapes</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Statut</th>
                      <th>Trouves</th>
                      <th>Nouveaux</th>
                      <th>Debut</th>
                      <th>Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapeJobs.length === 0 ? (
                      <tr><td colSpan={6} className="admin-table-empty">Aucun job de scraping.</td></tr>
                    ) : scrapeJobs.map((j) => (
                      <tr key={j.id}>
                        <td className="admin-cell-bold">{j.source_name}</td>
                        <td>
                          <span className={`admin-status admin-status--${j.status}`}>
                            {j.status === 'success' ? <><FiCheckCircle size={12} /> Succes</> :
                             j.status === 'failed' ? <><FiXCircle size={12} /> Echoue</> :
                             j.status === 'running' ? <><FiClock size={12} /> En cours</> :
                             j.status}
                          </span>
                        </td>
                        <td>{j.articles_found}</td>
                        <td>{j.articles_added}</td>
                        <td><span className="admin-date">{formatDate(j.started_at)}</span></td>
                        <td>
                          {j.error_message
                            ? <span className="admin-error-text">{j.error_message}</span>
                            : <span className="admin-muted">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ CURATED SOURCES ══ */}
        {section === 'curated' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Base curatee</h1>
                <p>{curatedSources.length} sources dans votre bibliotheque</p>
              </div>
              <div className="admin-header-actions">
                <button className="admin-pipeline-btn" onClick={() => { setShowCuratedForm(!showCuratedForm); setCuratedError('') }}>
                  {showCuratedForm ? <><FiX /> Annuler</> : <><FiPlus /> Ajouter une source</>}
                </button>
                <button className="admin-refresh-btn" onClick={() => loadSection('curated')}>
                  <FiRefreshCw /> Actualiser
                </button>
              </div>
            </div>

            {showCuratedForm && (
              <div className="admin-curated-form">
                <div className="admin-curated-form-row">
                  <input
                    type="text" placeholder="Nom du site *"
                    value={curatedForm.name}
                    onChange={e => setCuratedForm({ ...curatedForm, name: e.target.value })}
                    className="admin-curated-input"
                  />
                  <input
                    type="url" placeholder="https://example.com *"
                    value={curatedForm.url}
                    onChange={e => setCuratedForm({ ...curatedForm, url: e.target.value })}
                    className="admin-curated-input admin-curated-input--wide"
                  />
                  <select
                    value={curatedForm.source_type}
                    onChange={e => setCuratedForm({ ...curatedForm, source_type: e.target.value })}
                    className="admin-curated-select"
                  >
                    <option value="rss">RSS</option>
                    <option value="html">HTML</option>
                    <option value="api">API</option>
                  </select>
                </div>
                <div className="admin-curated-form-row">
                  <input
                    type="text" placeholder="Description courte"
                    value={curatedForm.description}
                    onChange={e => setCuratedForm({ ...curatedForm, description: e.target.value })}
                    className="admin-curated-input admin-curated-input--wide"
                  />
                  <input
                    type="text" placeholder="Tags (separes par des virgules) *"
                    value={curatedForm.tags}
                    onChange={e => setCuratedForm({ ...curatedForm, tags: e.target.value })}
                    className="admin-curated-input admin-curated-input--wide"
                  />
                  <input
                    type="number" placeholder="Priorite"
                    value={curatedForm.priority}
                    onChange={e => setCuratedForm({ ...curatedForm, priority: Number(e.target.value) })}
                    className="admin-curated-input admin-curated-input--small"
                  />
                </div>
                {curatedError && <div className="admin-curated-error">{curatedError}</div>}
                <button className="admin-pipeline-btn" onClick={handleAddCurated}>
                  <FiSave /> Enregistrer
                </button>
              </div>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Tags</th>
                    <th>Priorite</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {curatedSources.length === 0 ? (
                    <tr><td colSpan={6} className="admin-table-empty">Aucune source curatee. Ajoutez-en une !</td></tr>
                  ) : curatedSources.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="admin-cell-bold">{s.name}</div>
                        <div className="admin-cell-sub">{s.url}</div>
                        {s.description && <div className="admin-cell-sub">{s.description}</div>}
                      </td>
                      <td>
                        <span className={`admin-type-badge admin-type--${s.source_type}`}>
                          {s.source_type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="admin-keywords">
                          {s.tags.map((t, i) => (
                            <span key={i} className="admin-keyword-pill">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td>{s.priority}</td>
                      <td>
                        <span
                          className={`admin-status ${s.is_active ? 'admin-status--active' : 'admin-status--pending'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleCurated(s.id, s.is_active)}
                          title="Cliquer pour changer"
                        >
                          {s.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          onClick={() => handleDeleteCurated(s.id)}
                          title="Supprimer"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ USAGE IA ══ */}
        {section === 'ai-usage' && aiUsage && (
          <>
            <div className="admin-header">
              <div>
                <h1>Usage IA</h1>
                <p>Suivi de la consommation de tokens Groq</p>
              </div>
              <button className="admin-refresh-btn" onClick={() => loadSection('ai-usage')}>
                <FiRefreshCw /> Actualiser
              </button>
            </div>

            {/* Jauges quotidiennes */}
            <div className="ai-gauges-row">
              <div className="ai-gauge-card">
                <div className="ai-gauge-header">
                  <HiOutlineCpuChip size={18} />
                  <span>Tokens aujourd'hui</span>
                </div>
                <div className="ai-gauge-values">
                  <span className="ai-gauge-current">{aiUsage.today_tokens.toLocaleString()}</span>
                  <span className="ai-gauge-limit">/ {aiUsage.daily_token_limit.toLocaleString()}</span>
                </div>
                <div className="ai-gauge-bar">
                  <div
                    className={`ai-gauge-fill ${aiUsage.today_token_pct > 80 ? 'ai-gauge-fill--danger' : aiUsage.today_token_pct > 50 ? 'ai-gauge-fill--warn' : ''}`}
                    style={{ width: `${Math.min(aiUsage.today_token_pct, 100)}%` }}
                  />
                </div>
                <div className="ai-gauge-pct">{aiUsage.today_token_pct}%</div>
              </div>

              <div className="ai-gauge-card">
                <div className="ai-gauge-header">
                  <FiActivity size={18} />
                  <span>Requetes aujourd'hui</span>
                </div>
                <div className="ai-gauge-values">
                  <span className="ai-gauge-current">{aiUsage.today_calls.toLocaleString()}</span>
                  <span className="ai-gauge-limit">/ {aiUsage.daily_request_limit.toLocaleString()}</span>
                </div>
                <div className="ai-gauge-bar">
                  <div
                    className={`ai-gauge-fill ${aiUsage.today_calls_pct > 80 ? 'ai-gauge-fill--danger' : aiUsage.today_calls_pct > 50 ? 'ai-gauge-fill--warn' : ''}`}
                    style={{ width: `${Math.min(aiUsage.today_calls_pct, 100)}%` }}
                  />
                </div>
                <div className="ai-gauge-pct">{aiUsage.today_calls_pct}%</div>
              </div>
            </div>

            {/* Stats globales */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                  <HiOutlineCpuChip size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{aiUsage.total_tokens.toLocaleString()}</div>
                  <div className="admin-stat-label">Tokens total</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  <FiActivity size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{aiUsage.total_calls}</div>
                  <div className="admin-stat-label">Appels total</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>
                  <FiClock size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{aiUsage.today_tokens.toLocaleString()}</div>
                  <div className="admin-stat-label">Tokens aujourd'hui</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(45,122,79,0.1)', color: '#2d7a4f' }}>
                  <FiDatabase size={22} />
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{aiUsage.week_tokens.toLocaleString()}</div>
                  <div className="admin-stat-label">Tokens 7 jours</div>
                </div>
              </div>
            </div>

            {/* Par feature */}
            <div className="admin-section">
              <h2>Consommation par fonctionnalite</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fonctionnalite</th>
                      <th>Appels</th>
                      <th>Tokens</th>
                      <th>Moy. / appel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.by_feature.map((f) => (
                      <tr key={f.feature}>
                        <td className="admin-cell-bold">
                          {f.feature === 'suggest_themes' ? 'Suggestion themes' :
                           f.feature === 'suggest_sources' ? 'Suggestion sources' :
                           f.feature === 'rank_articles' ? 'Ranking articles' :
                           f.feature === 'generate_posts' ? 'Generation posts' : f.feature}
                        </td>
                        <td>{f.calls}</td>
                        <td><strong>{f.tokens.toLocaleString()}</strong></td>
                        <td>{f.calls > 0 ? Math.round(f.tokens / f.calls).toLocaleString() : 0}</td>
                      </tr>
                    ))}
                    {aiUsage.by_feature.length === 0 && (
                      <tr><td colSpan={4} className="admin-table-empty">Aucun appel IA enregistre.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logs recents */}
            <div className="admin-section">
              <h2>Derniers appels</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Fonctionnalite</th>
                      <th>Prompt</th>
                      <th>Completion</th>
                      <th>Total</th>
                      <th>Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.logs.map((l) => (
                      <tr key={l.id}>
                        <td><span className="admin-date">{formatDate(l.created_at)}</span></td>
                        <td>
                          <span className={`admin-type-badge admin-type--${l.feature === 'rank_articles' ? 'api' : 'rss'}`}>
                            {l.feature === 'suggest_themes' ? 'Themes' :
                             l.feature === 'suggest_sources' ? 'Sources' :
                             l.feature === 'rank_articles' ? 'Ranking' :
                             l.feature === 'generate_posts' ? 'Posts' : l.feature}
                          </span>
                        </td>
                        <td>{l.prompt_tokens.toLocaleString()}</td>
                        <td>{l.completion_tokens.toLocaleString()}</td>
                        <td><strong>{l.total_tokens.toLocaleString()}</strong></td>
                        <td>{l.user_email || <span className="admin-muted">Systeme</span>}</td>
                      </tr>
                    ))}
                    {aiUsage.logs.length === 0 && (
                      <tr><td colSpan={6} className="admin-table-empty">Aucun log.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ CALENDRIER COMMUNICATION ══ */}
        {section === 'calendar' && (
          <>
            <div className="admin-header">
              <div>
                <h1>Calendrier Communication</h1>
                <p>Mois {calendarMonth} — {calendarDays.length} jours programmes</p>
              </div>
              <div className="admin-header-actions">
                <div className="cal-month-nav">
                  <button
                    className="admin-refresh-btn"
                    onClick={() => { setCalendarMonth(Math.max(1, calendarMonth - 1)); setTimeout(() => loadSection('calendar'), 0) }}
                    disabled={calendarMonth <= 1}
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="cal-month-label">Mois {calendarMonth}</span>
                  <button
                    className="admin-refresh-btn"
                    onClick={() => { setCalendarMonth(calendarMonth + 1); setTimeout(() => loadSection('calendar'), 0) }}
                    disabled={calendarMonth >= 3}
                  >
                    <FiChevronRight />
                  </button>
                </div>
                <button className="admin-refresh-btn" onClick={() => loadSection('calendar')}>
                  <FiRefreshCw /> Actualiser
                </button>
              </div>
            </div>

            {/* Stats rapides */}
            {postsStats && (
              <div className="cal-stats-row">
                <div className="cal-stat">
                  <span className="cal-stat-value">{postsStats.total}</span>
                  <span className="cal-stat-label">Total posts</span>
                </div>
                <div className="cal-stat">
                  <span className="cal-stat-value cal-stat--draft">{postsStats.by_status.brouillon || 0}</span>
                  <span className="cal-stat-label">Brouillons</span>
                </div>
                <div className="cal-stat">
                  <span className="cal-stat-value cal-stat--valid">{postsStats.by_status.valide || 0}</span>
                  <span className="cal-stat-label">Valides</span>
                </div>
                <div className="cal-stat">
                  <span className="cal-stat-value cal-stat--published">{postsStats.by_status.publie || 0}</span>
                  <span className="cal-stat-label">Publies</span>
                </div>
              </div>
            )}

            {/* Grille calendrier */}
            <div className="cal-grid">
              {calendarDays.map((dayData) => (
                <div key={dayData.day} className="cal-day-card">
                  <div className="cal-day-header">
                    <span className="cal-day-number">J{dayData.day}</span>
                    <span className="cal-day-label">{dayData.date_label}</span>
                    <button
                      className="cal-validate-all"
                      onClick={() => handleBulkValidate(dayData.posts)}
                      title="Valider tous les brouillons de ce jour"
                    >
                      <FiCheckCircle size={14} /> Valider tout
                    </button>
                  </div>
                  <div className="cal-day-posts">
                    {dayData.posts.map((post) => (
                      <div
                        key={post.id}
                        className={`cal-post-card cal-post--${post.platform}`}
                        onClick={() => openPostDetail(post.id)}
                      >
                        <div className="cal-post-top">
                          <span className="cal-post-platform">
                            {post.platform === 'facebook' && <FaFacebook />}
                            {post.platform === 'linkedin' && <FaLinkedin />}
                            {post.platform === 'twitter' && <FaTwitter />}
                            {post.platform}
                          </span>
                          <span className={`admin-status admin-status--${post.status === 'brouillon' ? 'pending' : post.status === 'valide' ? 'active' : post.status === 'publie' ? 'sent' : 'failed'}`}>
                            {post.status}
                          </span>
                        </div>
                        <div className="cal-post-type">
                          <span className={`cal-type-badge cal-type--${post.post_type}`}>
                            {post.post_type}
                          </span>
                        </div>
                        <p className="cal-post-preview">{post.text}</p>
                        {post.cta && <div className="cal-post-cta">{post.cta}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {calendarDays.length === 0 && (
                <div className="cal-empty">Aucun post pour le mois {calendarMonth}.</div>
              )}
            </div>
          </>
        )}

        {/* ══ POST DETAIL ══ */}
        {section === 'post-detail' && selectedPost && (
          <>
            <div className="admin-header">
              <div>
                <h1>
                  <button className="cal-back-btn" onClick={() => loadSection('calendar')}>
                    <FiChevronLeft /> Retour
                  </button>
                  {selectedPost.date_label} — {selectedPost.platform}
                </h1>
                <p>{selectedPost.objective}</p>
              </div>
            </div>

            <div className="post-detail-layout">
              {/* Preview */}
              <div className="post-detail-preview">
                <div className="post-detail-preview-header">
                  <FiEye /> Apercu
                  <span className={`admin-status admin-status--${selectedPost.status === 'brouillon' ? 'pending' : selectedPost.status === 'valide' ? 'active' : selectedPost.status === 'publie' ? 'sent' : 'failed'}`}>
                    {selectedPost.status}
                  </span>
                </div>
                <div className={`post-detail-mockup post-mockup--${selectedPost.platform}`}>
                  <div className="post-mockup-header">
                    {selectedPost.platform === 'facebook' && <FaFacebook size={20} />}
                    {selectedPost.platform === 'linkedin' && <FaLinkedin size={20} />}
                    {selectedPost.platform === 'twitter' && <FaTwitter size={20} />}
                    <div>
                      <strong>DailyDigest</strong>
                      <span className="post-mockup-handle">
                        {selectedPost.platform === 'twitter' ? '@dailydigest' : 'Page officielle'}
                      </span>
                    </div>
                  </div>
                  <div className="post-mockup-body">{selectedPost.text}</div>
                  {selectedPost.hashtags.length > 0 && (
                    <div className="post-mockup-tags">
                      {selectedPost.hashtags.map((h, i) => <span key={i}>{h}</span>)}
                    </div>
                  )}
                  {/* Image uploadee */}
                  {selectedPost.image_url && (
                    <div className="post-mockup-uploaded-image">
                      <img src={selectedPost.image_url} alt="Post visual" />
                    </div>
                  )}

                  {/* Prompt image (si pas encore d'image uploadee) */}
                  {selectedPost.image_description && !selectedPost.image_url && (
                    <div className="post-mockup-image">
                      <FiCalendar size={24} />
                      <span>{selectedPost.image_description}</span>
                    </div>
                  )}
                  {selectedPost.cta && (
                    <div className="post-mockup-cta">{selectedPost.cta}</div>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="post-action-bar">
                  <button className="post-action-btn post-action-btn--copy" onClick={handleCopyText}>
                    <FiEdit2 size={14} /> Copier le texte
                  </button>
                  {selectedPost.image_url && (
                    <a
                      href={selectedPost.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-action-btn post-action-btn--download"
                    >
                      <FiEye size={14} /> Voir l'image
                    </a>
                  )}
                  {copyMsg && <span className="post-copy-msg">{copyMsg}</span>}
                </div>
              </div>

              {/* Edition */}
              <div className="post-detail-edit">
                <h3><FiEdit2 /> Modifier</h3>

                <label className="post-edit-label">Texte du post</label>
                <textarea
                  className="post-edit-textarea"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  rows={12}
                />

                {/* Image section */}
                <label className="post-edit-label">Image</label>
                <div className="post-image-section">
                  {selectedPost.image_url ? (
                    <div className="post-image-current">
                      <img src={selectedPost.image_url} alt="Current" />
                      <button className="post-image-remove" onClick={handleDeleteImage}>
                        <FiTrash2 size={12} /> Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="post-image-upload">
                      <div className="post-image-prompt">
                        <strong>Prompt pour creer l'image :</strong>
                        <p>{selectedPost.image_description || 'Aucun prompt defini'}</p>
                        <button
                          className="post-action-btn post-action-btn--copy"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPost.image_description)
                            setCopyMsg('Prompt copie !')
                            setTimeout(() => setCopyMsg(''), 2000)
                          }}
                        >
                          <FiEdit2 size={12} /> Copier le prompt
                        </button>
                      </div>
                      <label className="post-image-upload-btn">
                        <FiPlus size={14} /> Uploader l'image
                        <input type="file" accept="image/*" hidden onChange={handleUploadImage} />
                      </label>
                    </div>
                  )}
                </div>

                <label className="post-edit-label">Statut</label>
                <div className="post-edit-status-row">
                  {['brouillon', 'valide', 'rejete'].map(s => (
                    <button
                      key={s}
                      className={`post-status-btn ${editingStatus === s ? 'post-status-btn--active' : ''} post-status-btn--${s}`}
                      onClick={() => setEditingStatus(s)}
                    >
                      {s === 'brouillon' ? 'Brouillon' : s === 'valide' ? 'Valide' : 'Rejete'}
                    </button>
                  ))}
                </div>

                <div className="post-edit-meta">
                  <div><strong>Type:</strong> {selectedPost.post_type}</div>
                  <div><strong>Plateforme:</strong> {selectedPost.platform}</div>
                  <div><strong>Jour:</strong> {selectedPost.day}</div>
                  <div><strong>CTA:</strong> {selectedPost.cta || '—'}</div>
                </div>

                <button className="admin-pipeline-btn" onClick={handleUpdatePost}>
                  <FiSave /> Sauvegarder
                </button>
              </div>
            </div>
          </>
        )}

        {loading && !pipelinePolling && (
          <div className="admin-loading-overlay">
            <div className="admin-spinner" />
          </div>
        )}
      </main>
    </div>
    </>
  )
}

function renderUsersTable(users: RecentUser[]) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Themes</th>
            <th>Statut</th>
            <th>Inscription</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={5} className="admin-table-empty">Aucun utilisateur.</td></tr>
          ) : users.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{u.username.charAt(0).toUpperCase()}</div>
                  {u.username}
                </div>
              </td>
              <td>{u.email}</td>
              <td>{u.theme_count}</td>
              <td>
                <span className={`admin-status ${u.is_active ? 'admin-status--active' : 'admin-status--pending'}`}>
                  {u.is_active ? 'Actif' : 'En attente'}
                </span>
              </td>
              <td><span className="admin-date">{new Date(u.date_joined).toLocaleDateString('fr-FR')}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
