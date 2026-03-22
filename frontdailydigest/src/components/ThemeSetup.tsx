import { useState, useEffect } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit3,
  FiLoader,
  FiCheckCircle,
  FiLogOut,
  FiX,
  FiPlus,
  FiGlobe,
  FiFilter,
} from 'react-icons/fi'
import { HiOutlineNewspaper, HiOutlineSparkles, HiOutlineCpuChip } from 'react-icons/hi2'
import './ThemeSetup.css'
import { API_URL } from '../config'

interface Suggestion {
  name: string
  description: string
  keywords: string | string[]
}

interface SourceItem {
  name: string
  url: string
  type: string
  curated?: boolean
}

interface ThemeSetupProps {
  onDone?: () => void
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

function trackEvent(eventType: string, extraData: any = {}) {
  const sessionId = sessionStorage.getItem('session_id') || Math.random().toString(36).substring(7)
  sessionStorage.setItem('session_id', sessionId)

  fetch(`${API_URL}/track/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, session_id: sessionId, extra_data: extraData }),
  }).catch(() => {})
}

export default function ThemeSetup({ onDone }: ThemeSetupProps) {
  const [step, setStep] = useState(1)
  const [userText, setUserText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [sources, setSources] = useState<SourceItem[]>([])
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [created, setCreated] = useState(false)
  const [hasTheme, setHasTheme] = useState(false)
  const [digestProgress, setDigestProgress] = useState(0)

  // Criteres de pertinence
  const [criteria, setCriteria] = useState<string[]>([])
  const [newCriterion, setNewCriterion] = useState('')

  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user')
  const username = userData ? JSON.parse(userData).username : ''

  // Track step changes
  useEffect(() => {
    trackEvent(`theme_step_${step}`)
  }, [step])

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/themes/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHasTheme(true)
        }
      })
      .catch(() => {})
  }, [token])

  // Step 1 → 2
  const handleAnalyze = async () => {
    if (!userText.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/themes/suggest/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: userText }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur.'); return }
      setSuggestions(data.suggestions)
      setStep(2)
    } catch { setError('Impossible de contacter le serveur.') }
    finally { setLoading(false) }
  }

  // Step 2 → 3
  const handleSelect = (s: Suggestion) => {
    setSelected(s)
    setStep(3)
  }

  // Step 3 → 4 : confirmer theme, chercher sources
  const handleConfirmTheme = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/themes/suggest-sources/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: selected.name, keywords: selected.keywords }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur.'); return }
      setSources(data.sources || [])
      setStep(4)
    } catch { setError('Impossible de contacter le serveur.') }
    finally { setLoading(false) }
  }

  // Step 4 : gestion des sources
  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  const addSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return
    if (sources.length >= 10) return
    setSources([...sources, { name: newSourceName.trim(), url: newSourceUrl.trim(), type: 'html' }])
    setNewSourceName('')
    setNewSourceUrl('')
  }

  // Step 5 : gestion des criteres
  const addCriterion = () => {
    const text = newCriterion.trim()
    if (!text || criteria.length >= 8) return
    setCriteria([...criteria, text])
    setNewCriterion('')
  }

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const handleCriterionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCriterion()
    }
  }

  // Step 4 → 5 : generer les criteres par defaut a partir du theme
  const goToCriteria = () => {
    if (!selected) return
    // Generer des criteres par defaut si vide
    if (criteria.length === 0) {
      const defaults = [
        `Articles sur ${selected.name}`,
        `Actualites recentes uniquement`,
        `En francais de preference`,
      ]
      setCriteria(defaults)
    }
    setStep(5)
  }

  // Step 6 : creer le theme et generer le digest
  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    setDigestProgress(0)
    try {
      const res = await fetch(`${API_URL}/themes/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...selected, sources, filter_criteria: criteria }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur.'); return }

      trackEvent('theme_created', { themeName: selected.name })

      // Animer la barre de progression (fake, mais realiste)
      let progress = 10
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress > 95) progress = 95
        setDigestProgress(Math.floor(progress))
      }, 300)

      // Attendre ~8s puis finir
      setTimeout(() => {
        clearInterval(interval)
        setDigestProgress(100)
        setTimeout(() => setCreated(true), 500)
      }, 8000)
    } catch { setError('Impossible de contacter le serveur.') }
    finally { setLoading(false) }
  }

  const handleBack = () => {
    if (onDone) onDone()
    else window.location.hash = '#/home'
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.hash = '#/auth'
  }

  return (
    <div className="ts-page">
      <nav className="home-nav">
        <a href="#/home" className="logo">
          <div className="logo-icon"><HiOutlineNewspaper /></div>
          DailyDigest
        </a>
        <div className="home-nav-right">
          <span className="home-nav-user">{username}</span>
          <button className="home-logout-btn" onClick={handleLogout}>
            <FiLogOut /> Deconnexion
          </button>
        </div>
      </nav>

      <div className="ts-topbar">
        <button className="ts-back-link" onClick={handleBack}>
          <FiArrowLeft /> Retour a l'accueil
        </button>
      </div>

      {/* STEPPER */}
      {!created && !hasTheme && (
        <div className="ts-stepper-wrap">
          {[
            { num: 1, label: 'Description' },
            { num: 2, label: 'Theme' },
            { num: 3, label: 'Confirmation' },
            { num: 4, label: 'Sources' },
            { num: 5, label: 'Criteres' },
            { num: 6, label: 'Recapitulatif' },
          ].map((s, i) => (
            <div key={s.num} className="ts-stepper-item">
              {i > 0 && (
                <div className={`ts-stepper-line ${step >= s.num ? 'ts-stepper-line--active' : ''}`} />
              )}
              <div className={`ts-stepper-dot ${step > s.num ? 'ts-stepper-dot--done' : step === s.num ? 'ts-stepper-dot--active' : ''}`}>
                {step > s.num ? <FiCheckCircle size={14} /> : s.num}
              </div>
              <span className={`ts-stepper-label ${step >= s.num ? 'ts-stepper-label--active' : ''}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <main className="ts-main">
        {/* BLOQUE — deja un theme */}
        {step === 1 && !created && hasTheme && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiCheckCircle size={28} className="ts-content-icon" />
              <h1>Vous avez deja un theme</h1>
              <p>Vous ne pouvez avoir qu'un seul theme. Supprimez-le depuis vos preferences pour en configurer un nouveau.</p>
            </div>
            <div className="ts-confirm-actions">
              <button className="ts-btn-outline" onClick={handleBack}>
                <FiArrowLeft /> Retour a l'accueil
              </button>
              <button className="ts-btn-primary" onClick={() => window.location.hash = '#/preferences'}>
                Mes preferences <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — Saisie */}
        {step === 1 && !created && !hasTheme && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiEdit3 size={28} className="ts-content-icon" />
              <h1>De quoi voulez-vous rester informe ?</h1>
              <p>Decrivez votre sujet en quelques mots, une phrase ou meme un paragraphe. L'IA va analyser votre texte et vous proposer des themes structures.</p>
            </div>
            <div className="ts-textarea-wrap">
              <textarea
                className="ts-textarea"
                placeholder="Ex: Je veux suivre l'actualite des startups africaines, surtout dans la fintech et le mobile money..."
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                rows={6}
              />
              <div className="ts-textarea-hint">{userText.length}/500 caracteres</div>
            </div>
            {error && <div className="ts-error">{error}</div>}
            <button className="ts-btn-primary" onClick={handleAnalyze} disabled={!userText.trim() || loading}>
              {loading ? <><FiLoader className="ts-spin" /> Analyse en cours...</> : <>Analyser avec l'IA <HiOutlineCpuChip /></>}
            </button>
          </div>
        )}

        {/* STEP 2 — Choix du theme */}
        {step === 2 && !created && (
          <div className="ts-content">
            <div className="ts-content-header">
              <HiOutlineSparkles size={28} className="ts-content-icon" />
              <h1>Voici 2 themes suggeres</h1>
              <p>Choisissez celui qui correspond le mieux a vos attentes.</p>
            </div>
            <div className="ts-suggestions">
              {suggestions.map((s, i) => (
                <div key={i} className="ts-suggestion-card" onClick={() => handleSelect(s)}>
                  <div className="ts-suggestion-header">
                    <HiOutlineSparkles size={20} />
                    <h3>{s.name}</h3>
                  </div>
                  <p className="ts-suggestion-desc">{s.description}</p>
                  <div className="ts-keywords">
                    {parseKeywords(s.keywords).map((k, j) => (
                      <span key={j} className="ts-keyword">{k}</span>
                    ))}
                  </div>
                  <button className="ts-select-btn">Choisir ce theme <FiArrowRight /></button>
                </div>
              ))}
            </div>
            <button className="ts-btn-outline" onClick={() => { setStep(1); setError('') }}>
              <FiArrowLeft /> Modifier ma description
            </button>
          </div>
        )}

        {/* STEP 3 — Confirmer le theme */}
        {step === 3 && !created && selected && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiCheckCircle size={28} className="ts-content-icon" />
              <h1>Confirmer votre theme</h1>
              <p>L'etape suivante : l'IA va rechercher les meilleurs sites d'actualite pour ce theme.</p>
            </div>
            <div className="ts-confirm-card">
              <h2>{selected.name}</h2>
              <p className="ts-confirm-desc">{selected.description}</p>
              <div className="ts-confirm-section">
                <h4>Mots-cles</h4>
                <div className="ts-keywords">
                  {parseKeywords(selected.keywords).map((k, j) => (
                    <span key={j} className="ts-keyword">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="ts-error">{error}</div>}
            <div className="ts-confirm-actions">
              <button className="ts-btn-outline" onClick={() => { setStep(2); setError('') }}>
                <FiArrowLeft /> Changer de theme
              </button>
              <button className="ts-btn-primary" onClick={handleConfirmTheme} disabled={loading}>
                {loading ? <><FiLoader className="ts-spin" /> Recherche des sources...</> : <>Trouver les sources <FiGlobe /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Sources */}
        {step === 4 && !created && selected && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiGlobe size={28} className="ts-content-icon" />
              <h1>Sources d'actualite</h1>
              <p>L'IA a trouve {sources.length} sites pertinents pour <strong>{selected.name}</strong>. Vous pouvez en supprimer ou en ajouter (max 10).</p>
            </div>

            <div className="ts-sources-list">
              {sources.map((src, i) => (
                <div key={i} className="ts-source-item">
                  <div className="ts-source-info">
                    <FiGlobe className="ts-source-icon" />
                    <div>
                      <div className="ts-source-name">
                        {src.name}
                        {src.curated && <span className="ts-curated-badge">verifie</span>}
                      </div>
                      <div className="ts-source-url">{src.url}</div>
                    </div>
                  </div>
                  <button className="ts-source-remove" onClick={() => removeSource(i)} title="Supprimer">
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>

            {sources.length < 10 && (
              <div className="ts-add-source">
                <h4><FiPlus size={14} /> Ajouter un site ({sources.length}/10)</h4>
                <div className="ts-add-source-form">
                  <input
                    type="text"
                    placeholder="Nom du site"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="ts-add-input"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="ts-add-input ts-add-input--url"
                  />
                  <button
                    className="ts-add-btn"
                    onClick={addSource}
                    disabled={!newSourceName.trim() || !newSourceUrl.trim()}
                  >
                    <FiPlus /> Ajouter
                  </button>
                </div>
              </div>
            )}

            {sources.length >= 10 && (
              <div className="ts-sources-max">Nombre maximum de sources atteint (10/10)</div>
            )}

            {error && <div className="ts-error">{error}</div>}

            <div className="ts-confirm-actions" style={{ marginTop: '24px' }}>
              <button className="ts-btn-outline" onClick={() => { setStep(3); setError('') }}>
                <FiArrowLeft /> Retour
              </button>
              <button className="ts-btn-primary" onClick={goToCriteria} disabled={sources.length === 0}>
                Criteres de pertinence <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — Criteres de pertinence */}
        {step === 5 && !created && selected && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiFilter size={28} className="ts-content-icon" />
              <h1>Criteres de pertinence</h1>
              <p>Dites a l'IA ce que vous voulez voir (ou ne pas voir) dans votre digest. Ecrivez en langage naturel, comme si vous parliez a un assistant.</p>
            </div>

            <div className="ts-criteria-list">
              {criteria.map((c, i) => (
                <div key={i} className="ts-criterion-item">
                  <span className="ts-criterion-text">{c}</span>
                  <button className="ts-criterion-remove" onClick={() => removeCriterion(i)}>
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>

            {criteria.length < 8 && (
              <div className="ts-add-criterion">
                <input
                  type="text"
                  placeholder="Ex: Je ne veux pas de rumeurs, seulement des annonces confirmees"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onKeyDown={handleCriterionKeyDown}
                  className="ts-criterion-input"
                />
                <button
                  className="ts-add-btn"
                  onClick={addCriterion}
                  disabled={!newCriterion.trim()}
                >
                  <FiPlus /> Ajouter
                </button>
              </div>
            )}

            {criteria.length >= 8 && (
              <div className="ts-sources-max">Maximum 8 criteres atteints</div>
            )}

            <div className="ts-criteria-examples">
              <h4>Exemples de criteres :</h4>
              <div className="ts-criteria-example-list">
                {[
                  'Seulement des actualites de moins de 48h',
                  'Pas de contenu sponsorise ou publicitaire',
                  'Privilegier les analyses de fond aux breves',
                  'Je veux des articles en francais uniquement',
                ].filter(ex => !criteria.includes(ex)).slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    className="ts-criteria-example"
                    onClick={() => {
                      if (criteria.length < 8) {
                        setCriteria([...criteria, ex])
                      }
                    }}
                  >
                    <FiPlus size={12} /> {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="ts-confirm-actions" style={{ marginTop: '24px' }}>
              <button className="ts-btn-outline" onClick={() => { setStep(4); setError('') }}>
                <FiArrowLeft /> Retour aux sources
              </button>
              <button className="ts-btn-primary" onClick={() => setStep(6)}>
                Recapitulatif <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6 — Recap final */}
        {step === 6 && !created && selected && (
          <div className="ts-content">
            <div className="ts-content-header">
              <FiCheckCircle size={28} className="ts-content-icon" />
              <h1>Recapitulatif</h1>
              <p>Tout est pret. Verifiez et confirmez pour activer votre theme.</p>
            </div>

            <div className="ts-confirm-card">
              <h2>{selected.name}</h2>
              <p className="ts-confirm-desc">{selected.description}</p>

              <div className="ts-confirm-section">
                <h4>Mots-cles</h4>
                <div className="ts-keywords">
                  {parseKeywords(selected.keywords).map((k, j) => (
                    <span key={j} className="ts-keyword">{k}</span>
                  ))}
                </div>
              </div>

              <div className="ts-confirm-section">
                <h4>{sources.length} sources configurees</h4>
                <div className="ts-recap-sources">
                  {sources.map((src, i) => (
                    <div key={i} className="ts-recap-source">
                      <FiGlobe size={12} />
                      <span>{src.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {criteria.length > 0 && (
                <div className="ts-confirm-section">
                  <h4>Criteres de pertinence</h4>
                  <div className="ts-recap-criteria">
                    {criteria.map((c, i) => (
                      <div key={i} className="ts-recap-criterion">
                        <FiFilter size={12} />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ts-confirm-section">
                <h4>Frequence</h4>
                <p>Quotidien — chaque matin a 7h</p>
              </div>
            </div>

            {error && <div className="ts-error">{error}</div>}

            {digestProgress > 0 && digestProgress < 100 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#8a7060', marginBottom: '8px', fontWeight: '600' }}>
                  Generation du digest en cours... {digestProgress}%
                </div>
                <div style={{ width: '100%', height: '8px', background: '#ede8df', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#a0542a',
                    width: `${digestProgress}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            <div className="ts-confirm-actions">
              <button className="ts-btn-outline" onClick={() => { setStep(5); setError('') }} disabled={digestProgress > 0 && digestProgress < 100}>
                <FiArrowLeft /> Modifier les criteres
              </button>
              <button className="ts-btn-primary" onClick={handleCreate} disabled={loading || (digestProgress > 0 && digestProgress < 100)}>
                {digestProgress > 0 && digestProgress < 100 ? (
                  <><FiLoader className="ts-spin" /> Generation du digest...</>
                ) : (
                  <>Confirmer et activer <FiCheckCircle /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {created && selected && (
          <div className="ts-content ts-done">
            <FiCheckCircle size={56} className="ts-done-icon" />
            <h1>Theme cree !</h1>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>{selected.name}</strong> est actif avec {sources.length} sources.
              </p>
              <p style={{ color: '#27ae60', fontWeight: '600', marginBottom: '8px' }}>
                ✓ Votre premier digest vient d'être envoyé !
              </p>
              <p style={{ fontSize: '14px', color: '#8a7060', marginBottom: '16px' }}>
                Vérifiez vos emails (et dossier spam) pour le recevoir.
              </p>
              <p style={{ fontSize: '13px', color: '#8a7060' }}>
                Les prochains digests arriveront tous les jours à 7h du matin.
              </p>
            </div>
            <div className="ts-done-actions">
              <button className="ts-btn-outline" onClick={() => {
                setStep(1); setUserText(''); setSuggestions([]); setSelected(null)
                setSources([]); setCriteria([]); setCreated(false); setError('')
              }}>
                <HiOutlineSparkles /> Ajouter un autre theme
              </button>
              <button className="ts-btn-primary" onClick={handleBack}>
                Retour a l'accueil <FiArrowRight />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
