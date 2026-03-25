import { useState, useEffect } from 'react'
import {
  FiClock,
  FiMail,
  FiSettings,
  FiGlobe,
  FiPlus,
  FiLogOut,
  FiTrash2,
  FiSmartphone,
  FiCheck,
  FiAlertCircle,
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
  keywords: string | string[]
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

function parseKeywords(keywords: string | string[]): string[] {
  if (Array.isArray(keywords)) return keywords
  if (typeof keywords === 'string') {
    try {
      const parsed = JSON.parse(keywords)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return keywords.split(',').map(k => k.trim()).filter(k => k)
  }
  return []
}

export default function PreferencesPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTheme, setDeletingTheme] = useState(false)

  // WhatsApp configuration
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingWhatsapp, setEditingWhatsapp] = useState(false)

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
      fetch(`${API_URL}/auth/configure-whatsapp/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([userData, themesData, whatsappData]) => {
        setUser(userData)
        setThemes(themesData)
        setWhatsappPhone(whatsappData.phone_number || '')
        setWhatsappEnabled(whatsappData.whatsapp_enabled || false)
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

  const handleSaveWhatsapp = async () => {
    setWhatsappLoading(true)
    setWhatsappMessage(null)
    try {
      const res = await fetch(`${API_URL}/auth/configure-whatsapp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: whatsappPhone,
          whatsapp_enabled: whatsappEnabled,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setWhatsappMessage({ type: 'success', text: 'WhatsApp configure avec succes !' })
        setEditingWhatsapp(false)
      } else {
        setWhatsappMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' })
      }
    } catch (e) {
      setWhatsappMessage({ type: 'error', text: 'Impossible de contacter le serveur' })
    } finally {
      setWhatsappLoading(false)
    }
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

          {/* WHATSAPP */}
          <div className="pref-card">
            <div className="pref-card-header">
              <FiSmartphone size={20} />
              <h2>WhatsApp</h2>
            </div>
            {!editingWhatsapp ? (
              <div className="pref-whatsapp-view">
                {whatsappPhone ? (
                  <>
                    <div className="pref-info-item">
                      <div className="pref-info-label">Numero WhatsApp</div>
                      <div className="pref-info-value" style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                        {whatsappPhone}
                      </div>
                    </div>
                    <div className="pref-info-item">
                      <div className="pref-info-label">Digests par WhatsApp</div>
                      <div className="pref-info-value">
                        {whatsappEnabled ? (
                          <span style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiCheck size={16} /> Actif
                          </span>
                        ) : (
                          <span style={{ color: '#e67e22' }}>Desactive</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#8a7060' }}>
                    <p>Vous n'avez pas encore configure WhatsApp.</p>
                    <p style={{ fontSize: '13px', marginTop: '8px' }}>
                      Ajoutez votre numero pour recevoir vos digests par WhatsApp.
                    </p>
                  </div>
                )}
                <button
                  className="pref-btn-primary"
                  onClick={() => setEditingWhatsapp(true)}
                  style={{ marginTop: '16px' }}
                >
                  {whatsappPhone ? 'Modifier' : 'Ajouter mon numero'}
                </button>
              </div>
            ) : (
              <div className="pref-whatsapp-edit">
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3d1f0a', marginBottom: '8px' }}>
                    Numero WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+33612345678"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd4c4',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#8a7060', marginTop: '6px' }}>
                    Format: +33... (inclure le code pays)
                  </p>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#3d1f0a' }}>
                    Recevoir mes digests par WhatsApp
                  </span>
                </label>

                {whatsappMessage && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: whatsappMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                      color: whatsappMessage.type === 'success' ? '#27ae60' : '#c62828',
                      fontSize: '13px',
                    }}
                  >
                    {whatsappMessage.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
                    {whatsappMessage.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="pref-btn-primary"
                    onClick={handleSaveWhatsapp}
                    disabled={whatsappLoading}
                  >
                    {whatsappLoading ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => setEditingWhatsapp(false)}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #ddd4c4',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      color: '#3d1f0a',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
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

                  {parseKeywords(themes[0].keywords).length > 0 && (
                    <>
                      <div className="pref-theme-section-label">Mots-cles</div>
                      <div className="pref-keywords">
                        {parseKeywords(themes[0].keywords).map((kw, i) => (
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
