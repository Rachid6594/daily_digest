import { useEffect, useState } from 'react'
import {
  FiMail,
  FiStar,
  FiCheck,
  FiLock,
  FiArrowRight,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import {
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlineRocketLaunch,
  HiOutlineCpuChip,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineHeart,
  HiOutlineHomeModern,
  HiOutlineDevicePhoneMobile,
  HiOutlineBolt,
  HiOutlineMagnifyingGlass,
  HiOutlineSun,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import {
  BiBitcoin,
} from 'react-icons/bi'
import {
  HiOutlineFire,
} from 'react-icons/hi'
import AuthPage from './components/AuthPage'
import VerifyEmail from './components/VerifyEmail'
import HomePage from './components/HomePage'
import AdminDashboard from './components/AdminDashboard'
import ThemeSetup from './components/ThemeSetup'
import PreferencesPage from './components/PreferencesPage'

type Page = 'landing' | 'auth' | 'verify' | 'home' | 'admin' | 'theme-setup' | 'preferences'

function getPage(): Page {
  const hash = window.location.hash
  if (hash.startsWith('#/verify')) return 'verify'
  if (hash.startsWith('#/admin')) return 'admin'
  if (hash === '#/theme-setup') return 'theme-setup'
  if (hash === '#/preferences') return 'preferences'
  if (hash === '#/home') return 'home'
  if (hash === '#/auth') return 'auth'
  return 'landing'
}

function App() {
  const [page, setPage] = useState<Page>(getPage)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setPage(getPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (page !== 'landing') return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [page])

  const navigate = (dest: Page) => {
    window.location.hash = dest === 'landing' ? '' : `#/${dest}`
    setPage(dest)
  }

  if (page === 'verify') return <VerifyEmail />
  if (page === 'auth') return <AuthPage onLogin={(isAdmin) => navigate(isAdmin ? 'admin' : 'home')} />
  if (page === 'home') return <HomePage />
  if (page === 'admin') return <AdminDashboard />
  if (page === 'preferences') return <PreferencesPage />
  if (page === 'theme-setup') return <ThemeSetup onDone={() => navigate('home')} />

  return (
    <>
      {/* NAV */}
      <nav className="landing-nav">
        <a href="#" className="logo">
          <img src="/logo.png" alt="DailyDigest" className="logo-img" />
          DailyDigest
        </a>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <ul className={mobileMenuOpen ? 'nav-open' : ''}>
          <li><a href="#how" onClick={() => setMobileMenuOpen(false)}>Comment ca marche</a></li>
          <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Fonctionnalites</a></li>
          <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</a></li>
          <li><a href="#/auth" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Commencer <FiArrowRight /></a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-emoji">
          <FiMail size={80} />
        </div>

        <h1>Restez informe,<br/>sans effort.</h1>
        <div className="hero-sub-title">L'actualite curatee par IA, livree chaque matin.</div>

        <div className="sources-row">
          <span className="sources-label">Vos themes :</span>
          <span className="pill"><HiOutlineGlobeAlt /> Startups Afrique</span>
          <span className="pill"><BiBitcoin /> Crypto & Web3</span>
          <span className="pill"><HiOutlineCpuChip /> Intelligence Artificielle</span>
          <span className="pill"><HiOutlineChartBar /> Business</span>
          <span className="pill"><HiOutlineRocketLaunch /> Tech</span>
        </div>

        <div className="hero-price">
          <strong>Gratuit pendant le lancement</strong>
        </div>

        <a href="#/auth" className="btn-main">Commencer gratuitement</a>
        <p className="hero-note">Aucune carte bancaire requise </p>

        {/* EMAIL MOCKUP */}
        <div className="mockup-wrap fade-up">
          <div className="mockup-card">
            <div className="mockup-topbar">
              <div className="dot dot-r"></div>
              <div className="dot dot-y"></div>
              <div className="dot dot-g"></div>
              <div className="mockup-email-line">
                <FiMail size={14} /> Votre DailyDigest — Crypto & Startups · Vendredi 13 Mars 2026
              </div>
            </div>
            <div className="mockup-body">
              <div className="email-from">
                <div className="email-avatar">D</div>
                <div className="email-from-text">
                  <div className="from-name">DailyDigest <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· digest@dailydigest.ai</span></div>
                  <div className="from-date">Aujourd'hui a 07:00 · Crypto & Startups Afrique</div>
                </div>
              </div>
              <div className="email-subject-line">
                <HiOutlineFire size={20} /> Vos 5 actus du jour — Vendredi 13 Mars
              </div>

              <div className="email-article">
                <div className="email-num">1</div>
                <div>
                  <div className="email-art-title">Bitcoin franchit les $95k : opportunites pour les investisseurs africains</div>
                  <div className="email-art-desc">Les marches crypto enregistrent une hausse alors que les institutions africaines augmentent leurs positions...</div>
                  <span className="email-tag">Crypto</span>
                </div>
              </div>

              <div className="email-article">
                <div className="email-num">2</div>
                <div>
                  <div className="email-art-title">Wave leve $100M pour couvrir 8 nouveaux pays en Afrique de l'Ouest</div>
                  <div className="email-art-desc">La fintech senegalaise confirme sa serie C et vise une expansion rapide...</div>
                  <span className="email-tag">Startups Afrique</span>
                </div>
              </div>

              <div className="email-article">
                <div className="email-num">3</div>
                <div>
                  <div className="email-art-title">Les 5 tendances IA qui vont transformer les entreprises en 2026</div>
                  <div className="email-art-desc">De l'automatisation a l'IA generative, ce que les entrepreneurs doivent surveiller...</div>
                  <span className="email-tag">Tech & IA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <span className="m-item"><HiOutlineGlobeAlt /> Startups Afrique</span>
          <span className="m-item"><BiBitcoin /> Crypto & Web3</span>
          <span className="m-item"><HiOutlineCpuChip /> Intelligence Artificielle</span>
          <span className="m-item"><HiOutlineChartBar /> Business & Finance</span>
          <span className="m-item"><HiOutlineRocketLaunch /> Tech & Innovation</span>
          <span className="m-item"><HiOutlineLightBulb /> Climate Tech</span>
          <span className="m-item"><HiOutlineDevicePhoneMobile /> Gaming</span>
          <span className="m-item"><HiOutlineHeart /> HealthTech</span>
          <span className="m-item"><HiOutlineHomeModern /> Immobilier</span>
          <span className="m-item"><HiOutlineAcademicCap /> EdTech</span>
          {/* Duplicate for seamless loop */}
          <span className="m-item"><HiOutlineGlobeAlt /> Startups Afrique</span>
          <span className="m-item"><BiBitcoin /> Crypto & Web3</span>
          <span className="m-item"><HiOutlineCpuChip /> Intelligence Artificielle</span>
          <span className="m-item"><HiOutlineChartBar /> Business & Finance</span>
          <span className="m-item"><HiOutlineRocketLaunch /> Tech & Innovation</span>
          <span className="m-item"><HiOutlineLightBulb /> Climate Tech</span>
          <span className="m-item"><HiOutlineDevicePhoneMobile /> Gaming</span>
          <span className="m-item"><HiOutlineHeart /> HealthTech</span>
          <span className="m-item"><HiOutlineHomeModern /> Immobilier</span>
          <span className="m-item"><HiOutlineAcademicCap /> EdTech</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="section">
        <div className="section-label fade-up">Comment ca marche</div>
        <h2 className="section-title fade-up">Simple comme bonjour.</h2>
        <p className="section-sub fade-up">Trois etapes et vous recevez votre premiere newsletter des le lendemain matin.</p>

        <div className="steps-grid">
          <div className="step-card fade-up">
            <div className="step-num">Etape 01</div>
            <div className="step-icon-big"><HiOutlineSparkles size={40} /></div>
            <h3>Choisissez vos themes</h3>
            <p>Entrez n'importe quel sujet en texte libre. Notre IA comprend le contexte et associe automatiquement les meilleures sources.</p>
          </div>
          <div className="step-card fade-up">
            <div className="step-num">Etape 02</div>
            <div className="step-icon-big"><HiOutlineMagnifyingGlass size={40} /></div>
            <h3>L'IA travaille pour vous</h3>
            <p>Chaque nuit, le systeme scanne 10+ sources par theme, filtre le bruit et selectionne les 10 articles les plus pertinents.</p>
          </div>
          <div className="step-card fade-up">
            <div className="step-num">Etape 03</div>
            <div className="step-icon-big"><HiOutlineSun size={40} /></div>
            <h3>Lisez votre digest a 7h</h3>
            <p>Un email propre, bien structure, avec des resumes clairs. Tout ce dont vous avez besoin en 5 minutes de lecture.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section" style={{ paddingTop: 0 }}>
        <div className="section-label fade-up">Fonctionnalites</div>
        <h2 className="section-title fade-up">Tout ce dont vous avez besoin.</h2>
        <p className="section-sub fade-up">Concu pour les professionnels qui veulent rester informes sans perdre de temps.</p>

        <div className="features-grid">
          <div className="feat-card wide fade-up">
            <div className="feat-icon"><HiOutlineCpuChip size={22} /></div>
            <div>
              <h3>Curation par IA de pointe</h3>
              <p>Notre systeme utilise Groq et Gemini pour analyser le contenu, evaluer la pertinence et generer des resumes precis. Vous economisez jusqu'a 2 heures de lecture par jour tout en restant mieux informe que jamais.</p>
            </div>
          </div>
          <div className="feat-card fade-up">
            <div className="feat-icon"><HiOutlineBolt size={22} /></div>
            <div>
              <h3>Scraping temps reel</h3>
              <p>10+ sources scannees chaque jour par theme. Blogs, medias, newsletters — rien ne vous echappe.</p>
            </div>
          </div>
          <div className="feat-card fade-up">
            <div className="feat-icon"><HiOutlineSparkles size={22} /></div>
            <div>
              <h3>Themes illimites</h3>
              <p>Crypto, IA, startups, sante, finance — ajoutez autant de themes que vous voulez. Chaque theme = un digest dedie.</p>
            </div>
          </div>
          <div className="feat-card fade-up">
            <div className="feat-icon"><HiOutlineGlobeAlt size={22} /></div>
            <div>
              <h3>Pense pour l'Afrique</h3>
              <p>Sources africaines integrees. Contenu en francais et anglais. Pour les professionnels qui pensent local et global.</p>
            </div>
          </div>
          <div className="feat-card fade-up">
            <div className="feat-icon"><HiOutlineChartBar size={22} /></div>
            <div>
              <h3>Dashboard personnalise</h3>
              <p>Gerez vos themes, consultez l'historique de vos digests passes et ajustez vos preferences a tout moment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ paddingTop: 0 }}>
        <div className="section-label fade-up">Tarifs</div>
        <h2 className="section-title fade-up">Simple et transparent.</h2>
        <p className="section-sub fade-up">Pas d'engagement, annulation a tout moment.</p>

        <div className="pricing-grid">
          <div className="price-card fade-up">
            <div className="price-name">Gratuit</div>
            <div className="price-amount">0<sup>$</sup></div>
            <div className="price-per">Pendant le lancement</div>
            <div className="price-desc">Acces complet sans carte bancaire. Pour decouvrir DailyDigest.</div>
            <ul className="price-list">
              <li><span className="check-ico"><FiCheck size={10} /></span> 1 theme inclus</li>
              <li><span className="check-ico"><FiCheck size={10} /></span> Email quotidien 7h</li>
              <li><span className="check-ico"><FiCheck size={10} /></span> 10 articles par digest</li>
              <li><span className="check-ico"><FiCheck size={10} /></span> Resumes IA</li>
              <li><span className="check-ico"><FiCheck size={10} /></span> Sources verifiees</li>
            </ul>
            <a href="#/auth" className="btn-price btn-outline">Commencer <FiArrowRight /></a>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-label fade-up">Temoignages</div>
        <h2 className="section-title fade-up">Ce qu'ils en pensent.</h2>

        <div className="testi-grid">
          <div className="testi-card fade-up">
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p className="testi-text">"Je passais 1h30 le matin a lire les news. DailyDigest m'a redonne ce temps. Je recois l'essentiel en 5 minutes, des 7h."</p>
            <div className="testi-author">
              <div className="testi-avatar">K</div>
              <div>
                <div className="testi-name">Kofi A.</div>
                <div className="testi-role">Entrepreneur · Accra</div>
              </div>
            </div>
          </div>

          <div className="testi-card fade-up">
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p className="testi-text">"Le digest crypto est incroyablement bien source. C'est comme avoir un assistant personnel qui fait ma veille a ma place."</p>
            <div className="testi-author">
              <div className="testi-avatar">A</div>
              <div>
                <div className="testi-name">Aminata S.</div>
                <div className="testi-role">Trader Crypto · Dakar</div>
              </div>
            </div>
          </div>

          <div className="testi-card fade-up">
            <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
            <p className="testi-text">"Je dois suivre l'IA, la tech et le business en meme temps. DailyDigest gere les 3 en un seul email. Je ne peux plus m'en passer."</p>
            <div className="testi-author">
              <div className="testi-avatar">R</div>
              <div>
                <div className="testi-name">Rachid K.</div>
                <div className="testi-role">Fondateur · Abidjan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <div className="cta-section" id="signup">
        <div className="cta-box">
          <h2>Commencez a lire differemment.</h2>
          <p>Rejoignez les premiers utilisateurs. Gratuit pendant le lancement — aucune carte bancaire requise.</p>
          <a href="#/auth" className="btn-main" style={{ margin: '0 auto' }}>Rejoindre gratuitement <FiArrowRight /></a>
          <p className="cta-note" style={{ marginTop: 16 }}><FiLock size={12} /> Aucun spam. Desabonnement en 1 clic.</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="logo">
          <img src="/logo.png" alt="DailyDigest" className="logo-img" />
          DailyDigest
        </div>
        <p>&copy; 2026 DailyDigest — Fait avec amour pour l'Afrique & le monde.</p>
        <div className="footer-links">
          <a href="#">Confidentialite</a>
          <a href="#">Conditions</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  )
}

export default App
