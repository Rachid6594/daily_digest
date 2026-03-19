import { useState, useEffect } from 'react'
import {
  FiLogOut,
  FiClock,
  FiMail,
  FiPlus,
  FiSettings,
  FiArrowRight,
  FiEdit2,
  FiCheck,
  FiTrash2,
} from 'react-icons/fi'
import { HiOutlineNewspaper, HiOutlineSparkles } from 'react-icons/hi2'
import './HomePage.css'
import { API_URL } from '../config'

interface UserData {
  id: number
  username: string
  email: string
  language: string
  preferred_time: string
  is_admin: boolean
  date_joined: string
}

interface Theme {
  id: number
  name: string
  is_active: boolean
}

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTime, setEditingTime] = useState(false)
  const [timeValue, setTimeValue] = useState('')
  const [savingTime, setSavingTime] = useState(false)
  const [deletingTheme, setDeletingTheme] = useState(false)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (!token) {
      window.location.hash = '#/auth'
      return
    }

    fetch(`${API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setUser(data)
        if (data.is_admin) {
          window.location.hash = '#/admin'
          return
        }
        // Charger les themes
        fetch(`${API_URL}/themes/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((t) => setThemes(t))
          .catch(() => {})
      })
      .catch((err) => {
        console.error('Erreur /me/:', err)
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

  const handleEditTime = () => {
    setTimeValue(user?.preferred_time?.slice(0, 5) || '07:00')
    setEditingTime(true)
  }

  const handleSaveTime = async () => {
    setSavingTime(true)
    try {
      const res = await fetch(`${API_URL}/auth/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferred_time: timeValue }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch { /* ignore */ }
    setSavingTime(false)
    setEditingTime(false)
  }

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Supprimer ce theme ? Cette action est irreversible.')) return
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
      <div className="home-loading">
        <div className="home-spinner" />
      </div>
    )
  }

  if (!user) return null

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir'

  return (
    <div className="home-page">
      {/* NAV */}
      <nav className="home-nav">
        <a href="#/home" className="logo">
          <div className="logo-icon">
            <HiOutlineNewspaper />
          </div>
          DailyDigest
        </a>
        <div className="home-nav-center">
          <a href="#/home" className={`home-nav-tab ${!window.location.hash.includes('preferences') ? 'active' : ''}`}>
            <HiOutlineNewspaper size={15} /> Accueil
          </a>
          <a href="#/preferences" className={`home-nav-tab ${window.location.hash.includes('preferences') ? 'active' : ''}`}>
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

      {/* HERO SECTION */}
      <section className="home-hero">
        <h1>
          {greeting}, <span className="home-hero-name">{user.username}</span>
        </h1>
        <p className="home-hero-sub">
          Votre prochain digest arrive a{' '}
          <strong>{user.preferred_time?.slice(0, 5) || '07:00'}</strong> dans
          votre boite mail.
        </p>
      </section>

      {/* CARDS */}
      <section className="home-content">
        {/* THEME */}
        <div className="home-card">
          <div className="home-card-header">
            <HiOutlineSparkles size={20} />
            <h2>Mon theme</h2>
          </div>
          {themes.length === 0 ? (
            <div className="home-empty">
              <p>Vous n'avez pas encore de theme.</p>
              <p className="home-empty-hint">
                Configurez votre theme pour recevoir votre digest
                personnalise.
              </p>
              <button className="home-btn-primary" onClick={() => window.location.hash = '#/theme-setup'}>
                <FiPlus /> Configurer mon theme
              </button>
            </div>
          ) : (
            <div className="home-themes-list">
              <div className="home-theme-item">
                <span className="home-theme-dot" />
                <span>{themes[0].name}</span>
              </div>
              <button
                className="home-btn-outline home-btn-delete"
                onClick={() => handleDeleteTheme(themes[0].id)}
                disabled={deletingTheme}
              >
                <FiTrash2 /> {deletingTheme ? 'Suppression...' : 'Supprimer et reconfigurer'}
              </button>
            </div>
          )}
        </div>

        {/* INFOS */}
        <div className="home-card">
          <div className="home-card-header">
            <FiMail size={20} />
            <h2>Mon digest</h2>
          </div>
          <div className="home-info-rows">
            <div className="home-info-row">
              <FiClock className="home-info-icon" />
              <div style={{ flex: 1 }}>
                <div className="home-info-label">Heure d'envoi</div>
                {editingTime ? (
                  <div className="home-time-edit">
                    <input
                      type="time"
                      className="home-time-input"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                    />
                    <button className="home-time-save" onClick={handleSaveTime} disabled={savingTime}>
                      <FiCheck size={14} /> {savingTime ? '...' : 'Enregistrer'}
                    </button>
                    <button className="home-time-cancel" onClick={() => setEditingTime(false)}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="home-info-value home-info-editable" onClick={handleEditTime}>
                    {user.preferred_time?.slice(0, 5) || '07:00'} UTC
                    <FiEdit2 size={13} className="home-edit-icon" />
                  </div>
                )}
              </div>
            </div>
            <div className="home-info-row">
              <FiMail className="home-info-icon" />
              <div>
                <div className="home-info-label">Email de reception</div>
                <div className="home-info-value">{user.email}</div>
              </div>
            </div>
            <div className="home-info-row">
              <FiSettings className="home-info-icon" />
              <div>
                <div className="home-info-label">Langue</div>
                <div className="home-info-value">
                  {user.language === 'fr' ? 'Francais' : 'English'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="home-card home-card--cta">
          <HiOutlineSparkles size={28} />
          {themes.length === 0 ? (
            <>
              <h3>Commencez maintenant</h3>
              <p>
                Configurez votre theme pour recevoir chaque matin un digest
                personnalise dans votre boite mail.
              </p>
              <button className="home-btn-primary" onClick={() => window.location.hash = '#/theme-setup'}>
                Configurer mon theme <FiArrowRight />
              </button>
            </>
          ) : (
            <>
              <h3>Tout est en place !</h3>
              <p>
                Votre theme est actif. Consultez vos preferences ou supprimez
                votre theme pour en configurer un nouveau.
              </p>
              <button className="home-btn-primary" onClick={() => window.location.hash = '#/preferences'}>
                Voir mes preferences <FiArrowRight />
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
