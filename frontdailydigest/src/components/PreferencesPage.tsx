import { useState, useEffect } from 'react'
import {
  FiClock,
  FiMail,
  FiSettings,
  FiGlobe,
  FiPlus,
  FiLogOut,
  FiTrash2,
} from 'react-icons/fi'
import { HiOutlineNewspaper, HiOutlineSparkles } from 'react-icons/hi2'
import './HomePage.css'
import './PreferencesPage.css'
import { API_URL } from '../config'

interface Source {
  id: number
  name: string
  url: string
  type: string
}

interface Theme {
  id: number
  name: string
  description: string
  keywords: string[]
  is_active: boolean
  frequency: string
  created_at: string
  sources: Source[]
}

interface UserData {
  id: number
  username: string
  email: string
  language: string
  preferred_time: string
  is_admin: boolean
  date_joined: string
}

export default function PreferencesPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTheme, setDeletingTheme] = useState(false)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (!token) {
      window.location.hash = '#/auth'
      return
    }

    Promise.all([
      fetch(`${API_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/themes/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([userData, themesData]) => {
        setUser(userData)
        setThemes(themesData)
      })
      .catch(() => {
        localStorage.clear()
        window.location.hash = '#/auth'
      })
      .finally(() => setLoading(false))
  }, [token])

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

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Supprimer ce theme ? Vous pourrez en configurer un nouveau ensuite.')) return
    setDeletingTheme(true)
    try {
      await fetch(`${API_URL}/themes/${themeId}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setThemes([])
    } catch { /* ignore */ }
    setDeletingTheme(false)
  }

  if (loading) {
    return (
      <div className="pref-loading">
        <div className="pref-spinner" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="pref-page">
      {/* NAV */}
      <nav className="home-nav">
        <a href="#/home" className="logo">
          <div className="logo-icon">
            <HiOutlineNewspaper />
          </div>
          DailyDigest
        </a>
        <div className="home-nav-center">
          <a href="#/home" className="home-nav-tab">
            <HiOutlineNewspaper size={15} /> Accueil
          </a>
          <a href="#/preferences" className="home-nav-tab active">
            <FiSettings size={15} /> Preferences
          </a>
        </div>
        <div className="home-nav-right">
          <div className="home-nav-user-menu">
            <span className="home-nav-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span className="home-nav-user">{user.username}</span>
          </div>
          <button className="home-logout-btn" onClick={handleLogout} title="Deconnexion">
            <FiLogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="pref-main">
        <div className="pref-header">
          <FiSettings size={28} className="pref-header-icon" />
          <h1>Mes preferences</h1>
          <p>Retrouvez ici vos parametres et tous vos themes configures.</p>
        </div>

        <div className="pref-sections">
          {/* INFOS UTILISATEUR */}
          <div className="pref-card">
            <div className="pref-card-header">
              <FiMail size={20} />
              <h2>Mon compte</h2>
            </div>
            <div className="pref-info-grid">
              <div className="pref-info-item">
                <div className="pref-info-label">Email</div>
                <div className="pref-info-value">{user.email}</div>
              </div>
              <div className="pref-info-item">
                <div className="pref-info-label">Nom d'utilisateur</div>
                <div className="pref-info-value">{user.username}</div>
              </div>
              <div className="pref-info-item">
                <div className="pref-info-label">
                  <FiClock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Heure d'envoi
                </div>
                <div className="pref-info-value">
                  {user.preferred_time?.slice(0, 5) || '07:00'} UTC
                </div>
              </div>
              <div className="pref-info-item">
                <div className="pref-info-label">Langue</div>
                <div className="pref-info-value">
                  {user.language === 'fr' ? 'Francais' : 'English'}
                </div>
              </div>
            </div>
          </div>

          {/* THEME */}
          <div className="pref-card">
            <div className="pref-card-header">
              <HiOutlineSparkles size={20} />
              <h2>Mon theme</h2>
            </div>

            {themes.length === 0 ? (
              <div className="pref-empty">
                <p>Aucun theme configure.</p>
                <p className="pref-empty-hint">
                  Configurez votre theme pour commencer a recevoir votre digest.
                </p>
                <button
                  className="pref-btn-primary"
                  onClick={() => (window.location.hash = '#/theme-setup')}
                >
                  <FiPlus /> Configurer mon theme
                </button>
              </div>
            ) : (
              <div className="pref-theme-list">
                <div className="pref-theme-card">
                  <div className="pref-theme-top">
                    <span className="pref-theme-name">{themes[0].name}</span>
                    <span
                      className={`pref-theme-badge ${
                        themes[0].is_active
                          ? 'pref-theme-badge--active'
                          : 'pref-theme-badge--inactive'
                      }`}
                    >
                      {themes[0].is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {themes[0].description && (
                    <p className="pref-theme-desc">{themes[0].description}</p>
                  )}

                  {themes[0].keywords.length > 0 && (
                    <>
                      <div className="pref-theme-section-label">Mots-cles</div>
                      <div className="pref-keywords">
                        {themes[0].keywords.map((kw, i) => (
                          <span key={i} className="pref-keyword">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {themes[0].sources.length > 0 && (
                    <>
                      <div className="pref-theme-section-label">
                        Sources ({themes[0].sources.length})
                      </div>
                      <div className="pref-sources">
                        {themes[0].sources.map((src) => (
                          <div key={src.id} className="pref-source-item">
                            <FiGlobe size={14} className="pref-source-icon" />
                            <span>{src.name}</span>
                            <span className="pref-source-url">{src.url}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    className="pref-btn-delete"
                    onClick={() => handleDeleteTheme(themes[0].id)}
                    disabled={deletingTheme}
                  >
                    <FiTrash2 /> {deletingTheme ? 'Suppression...' : 'Supprimer et reconfigurer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
