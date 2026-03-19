import { useState } from 'react'
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi'
import { HiOutlineNewspaper } from 'react-icons/hi2'
import './AuthPage.css'
import { API_AUTH_URL } from '../config'

const API_URL = API_AUTH_URL

type AlertType = { type: 'success' | 'error'; message: string; verifyUrl?: string } | null

interface AuthPageProps {
  onLogin?: (isAdmin: boolean) => void
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<AlertType>(null)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const switchMode = (newMode: 'login' | 'register') => {
    setAlert(null)
    setMode(newMode)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const res = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
        // Redirection selon le role
        if (onLogin) {
          onLogin(data.user.is_admin)
        }
        return
      } else {
        setAlert({ type: 'error', message: data.error || 'Erreur de connexion.' })
      }
    } catch {
      setAlert({ type: 'error', message: 'Impossible de contacter le serveur.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    if (registerForm.password !== registerForm.confirmPassword) {
      setAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas.' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          confirm_password: registerForm.confirmPassword,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setAlert({ type: 'success', message: data.message, verifyUrl: data.verify_url })
        setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' })
      } else {
        const firstError = Object.values(data).flat()[0]
        setAlert({ type: 'error', message: (firstError as string) || 'Erreur lors de l\'inscription.' })
      }
    } catch {
      setAlert({ type: 'error', message: 'Impossible de contacter le serveur.' })
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className={`auth-page ${isRegister ? 'auth-page--register' : ''}`}>

      {/* ── OVERLAY PANEL (branding, slides left/right) ── */}
      <div className="auth-overlay">
        <div className="auth-overlay-inner">
          <a href="/" className="logo">
            <div className="logo-icon">
              <HiOutlineNewspaper />
            </div>
            DailyDigest
          </a>

          <div className={`auth-overlay-content ${!isRegister ? 'active' : ''}`}>
            <h1 className="auth-overlay-title">
              L'actualite qui compte,<br />livree chaque matin.
            </h1>
            <p className="auth-overlay-desc">
              Rejoignez des professionnels qui economisent 2h de veille par jour grace a l'IA.
            </p>
            <div className="auth-overlay-features">
              <div className="auth-feature"><span className="auth-feature-dot" />Curation IA de 10+ sources par theme</div>
              <div className="auth-feature"><span className="auth-feature-dot" />Digest quotidien a 7h dans votre boite mail</div>
              <div className="auth-feature"><span className="auth-feature-dot" />Gratuit pendant le lancement</div>
            </div>
            <button className="auth-overlay-btn" onClick={() => switchMode('register')}>
              Pas encore de compte ? <FiArrowRight />
            </button>
          </div>

          <div className={`auth-overlay-content ${isRegister ? 'active' : ''}`}>
            <h1 className="auth-overlay-title">
              Content de vous<br />revoir !
            </h1>
            <p className="auth-overlay-desc">
              Connectez-vous pour retrouver vos themes, votre historique et vos digests personnalises.
            </p>
            <div className="auth-overlay-features">
              <div className="auth-feature"><span className="auth-feature-dot" />Votre dashboard vous attend</div>
              <div className="auth-feature"><span className="auth-feature-dot" />Reprenez la ou vous en etiez</div>
              <div className="auth-feature"><span className="auth-feature-dot" />Vos preferences sont sauvegardees</div>
            </div>
            <button className="auth-overlay-btn" onClick={() => switchMode('login')}>
              Deja un compte ? <FiArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* ── FORMS CONTAINER ── */}
      <div className="auth-forms-wrap">
        {/* LOGIN FORM */}
        <div className={`auth-form-panel ${!isRegister ? 'active' : ''}`}>
          <div className="auth-card">
            <h2 className="auth-form-title">Bon retour parmi nous</h2>
            <p className="auth-form-sub">Connectez-vous pour acceder a votre dashboard.</p>

            {alert && !isRegister && (
              <div className={`auth-alert auth-alert--${alert.type}`}>
                {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                {alert.message}
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <div className="auth-input-wrap">
                  <FiMail className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Mot de passe</label>
                <div className="auth-input-wrap">
                  <FiLock className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="auth-options">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#" className="auth-forgot">Mot de passe oublie ?</a>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Connexion...' : <>Se connecter <FiArrowRight /></>}
              </button>

              <p className="auth-switch auth-switch--mobile">
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => switchMode('register')}>Creer un compte</button>
              </p>
            </form>
          </div>
        </div>

        {/* REGISTER FORM */}
        <div className={`auth-form-panel ${isRegister ? 'active' : ''}`}>
          <div className="auth-card">
            <h2 className="auth-form-title">Creez votre compte</h2>
            <p className="auth-form-sub">Commencez a recevoir vos digests des demain matin.</p>

            {alert && isRegister && (
              <div className={`auth-alert auth-alert--${alert.type}`}>
                {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                {alert.message}
              </div>
            )}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reg-username">Nom d'utilisateur</label>
                <div className="auth-input-wrap">
                  <FiUser className="auth-input-icon" />
                  <input
                    id="reg-username"
                    type="text"
                    placeholder="johndoe"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email">Email</label>
                <div className="auth-input-wrap">
                  <FiMail className="auth-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password">Mot de passe</label>
                <div className="auth-input-wrap">
                  <FiLock className="auth-input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 caracteres"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
                <div className="auth-input-wrap">
                  <FiLock className="auth-input-icon" />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Retapez votre mot de passe"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Creation...' : <>Creer mon compte <FiArrowRight /></>}
              </button>

              <p className="auth-switch auth-switch--mobile">
                Deja un compte ?{' '}
                <button type="button" onClick={() => switchMode('login')}>Se connecter</button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
