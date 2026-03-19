import { useEffect, useState } from 'react'
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { HiOutlineNewspaper } from 'react-icons/hi2'
import { API_AUTH_URL } from '../config'

const API_URL = API_AUTH_URL

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const hash = window.location.hash
    const tokenMatch = hash.match(/token=([^&]+)/)
    const token = tokenMatch ? tokenMatch[1] : null

    if (!token) {
      setStatus('error')
      setMessage('Lien de verification invalide.')
      return
    }

    fetch(`${API_URL}/verify-email/?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else {
          setStatus('success')
          setMessage(data.message)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Impossible de contacter le serveur.')
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(61,31,10,0.1)',
      }}>
        <a href="/" className="logo" style={{ justifyContent: 'center', marginBottom: '32px' }}>
          <div className="logo-icon">
            <HiOutlineNewspaper />
          </div>
          DailyDigest
        </a>

        {status === 'loading' && (
          <>
            <FiLoader size={40} style={{ color: 'var(--brown-btn)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Verification en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FiCheckCircle size={48} style={{ color: '#2d7a4f', marginBottom: '16px' }} />
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--brown)',
              marginBottom: '12px',
            }}>
              Email confirme !
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
              {message}
            </p>
            <a
              href="#/auth"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--brown-btn)',
                color: '#fff',
                padding: '14px 36px',
                borderRadius: '100px',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Se connecter
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <FiAlertCircle size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--brown)',
              marginBottom: '12px',
            }}>
              Verification echouee
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
              {message}
            </p>
            <a
              href="#/auth"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--brown-btn)',
                color: '#fff',
                padding: '14px 36px',
                borderRadius: '100px',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Retour a la connexion
            </a>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
