import { useState, useEffect } from 'react'
import { FiArrowLeft, FiLoader } from 'react-icons/fi'
import { HiOutlineChartBar } from 'react-icons/hi2'
import { API_URL } from '../config'

interface FunnelStats {
  funnel: {
    [key: string]: number
  }
  conversion_rates: {
    landing_to_auth_start: number
    auth_start_to_complete: number
    auth_to_theme: number
    total_conversion: number
  }
}

const FUNNEL_LABELS: { [key: string]: string } = {
  landing_visit: 'Visite landing',
  auth_start: 'Début inscription',
  auth_complete: 'Inscription complétée',
  theme_step_1: 'Step 1 - Description',
  theme_step_2: 'Step 2 - Sélection thème',
  theme_created: 'Thème créé ✓',
}

export default function AdminFunnelPage() {
  const [stats, setStats] = useState<FunnelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetch(`${API_URL}/admin/funnel/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((e) => {
        setError('Impossible de charger les stats')
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <FiLoader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p>Chargement des stats...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        {error || 'Impossible de charger les stats'}
      </div>
    )
  }

  const maxCount = Math.max(...Object.values(stats.funnel))

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => (window.location.hash = '#/home')}
        style={{
          background: 'none',
          border: 'none',
          color: '#a0542a',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <FiArrowLeft /> Retour
      </button>

      <div style={{ background: '#faf8f4', padding: '32px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <HiOutlineChartBar size={28} style={{ color: '#a0542a' }} />
          <h1 style={{ margin: 0, color: '#3d1f0a', fontSize: '24px' }}>Funnel d'onboarding</h1>
        </div>

        {/* Funnel visuel */}
        <div style={{ marginBottom: '40px' }}>
          {Object.entries(stats.funnel).map(([key, count], idx) => {
            const percentage = (count / maxCount) * 100
            const label = FUNNEL_LABELS[key] || key
            return (
              <div key={key} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#3d1f0a' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '14px', color: '#8a7060', fontWeight: '600' }}>
                    {count} sessions
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '32px',
                    background: '#ede8df',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background:
                        idx === 0
                          ? '#3498db'
                          : idx === 1
                          ? '#f39c12'
                          : idx === 2
                          ? '#e74c3c'
                          : idx === 3
                          ? '#9b59b6'
                          : idx === 4
                          ? '#1abc9c'
                          : '#27ae60',
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                    }}
                  >
                    {percentage > 10 && (
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>
                        {Math.round(percentage)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Taux de conversion */}
        <div
          style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #ede8df',
          }}
        >
          <h3 style={{ margin: '0 0 16px', color: '#3d1f0a', fontSize: '16px' }}>
            Taux de conversion
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #ede8df' }}>
              <div style={{ fontSize: '12px', color: '#8a7060' }}>Landing → Auth start</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a0542a' }}>
                {stats.conversion_rates.landing_to_auth_start}%
              </div>
            </div>

            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #ede8df' }}>
              <div style={{ fontSize: '12px', color: '#8a7060' }}>Auth start → Complete</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a0542a' }}>
                {stats.conversion_rates.auth_start_to_complete}%
              </div>
            </div>

            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #ede8df' }}>
              <div style={{ fontSize: '12px', color: '#8a7060' }}>Auth → Thème créé</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#a0542a' }}>
                {stats.conversion_rates.auth_to_theme}%
              </div>
            </div>

            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #ede8df' }}>
              <div style={{ fontSize: '12px', color: '#8a7060' }}>Conversion totale</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60' }}>
                {stats.conversion_rates.total_conversion}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
