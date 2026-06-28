import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import Lenis from 'lenis'
import { scrollState, onSectionChange, SECTION_IDS } from './scrollState'

// Lazy-load all Three.js / r3f code → splits into its own chunk,
// loads AFTER first paint so the page feels instant.
const FixedBackground3D = lazy(() => import('./scenes3d.jsx').then(m => ({ default: m.FixedBackground3D })))
const HeroCard3D = lazy(() => import('./scenes3d.jsx').then(m => ({ default: m.HeroCard3D })))

/* ═══════════════════════════════════════════════════════════════
   ICONS — inline SVG (no extra deps)
   ═══════════════════════════════════════════════════════════════ */

const ArrowUpRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
  </svg>
)
const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)


/* ═══════════════════════════════════════════════════════════════
   DATA — your real content, unchanged
   ═══════════════════════════════════════════════════════════════ */

const EXPERIENCE = [
  {
    role: 'Full Stack Developer Intern', company: 'Appzeto', date: 'Jun 2026 — Present',
    points: [
      'Collaborating on the development of scalable web applications using modern full-stack technologies.',
      'Assisting in building responsive frontend interfaces and integrating robust backend services.',
    ],
  },
  {
    role: 'Technical Content Writer (Python)', company: 'JD Bots', date: '2021',
    points: [
      'Authored and published technical blogs focusing on Python programming concepts and applications.',
      'Communicated complex technical knowledge effectively to a broad audience during high school.',
    ],
  },
]

const PROJECTS = [
  {
    title: 'Omni AI Agent Supervisor',
    desc: 'Real-time full-stack dashboard to monitor and manage simulated AI customer service agents. Custom backend rules-engine for intent classification and sentiment analysis with live WebSocket data streaming.',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'WebSockets', 'Recharts'],
    link: 'https://github.com/anuragpandey4',
  },
  {
    title: 'LexChain',
    desc: 'Blockchain-based document verification system ensuring data authenticity and preventing tampering. Integrated Solidity smart contracts for decentralized verification with a React frontend.',
    tags: ['React', 'Solidity', 'MongoDB', 'Node.js', 'Tailwind'],
    link: 'https://github.com/anuragpandey4',
  },
  {
    title: 'Custom printf Function',
    desc: 'Robust custom implementation of the standard C library printf function with efficient parsing logic for handling multiple format specifiers.',
    tags: ['C', 'Variadic Functions', 'stdarg.h'],
    link: 'https://github.com/anuragpandey4',
  },
]

const SKILLS = [
  { label: 'languages',  items: ['C', 'C++', 'JavaScript', 'Python', 'Solidity', 'HTML', 'CSS'] },
  { label: 'frameworks', items: ['React.js', 'Node.js', 'Express.js', 'Tailwind CSS', 'WebSockets'] },
  { label: 'databases',  items: ['MongoDB', 'Mongoose', 'MySQL'] },
  { label: 'tools',      items: ['Git', 'GitHub', 'Jest', 'Jira', 'Mermaid', 'Markdown'] },
]

const EDUCATION = [
  {
    school: 'IIST, Indore',
    degree: 'B.Tech in Computer Science & Engineering — 3rd Year',
    date: '2023 — 2027', detail: 'CGPA: 8.22',
  },
  {
    school: 'Sky Heights Academy, Betma',
    degree: 'Class XII — 90.0% · Class X — 96.2%',
    date: 'CBSE', detail: null,
  },
]

const ACHIEVEMENTS = [
  'Responsive Web Design certification — 300 hours, freeCodeCamp',
  'Won the Model Parliament (MOP) competition — Lexicon Club',
  'Core Member of ACM Chapter at IIST Indore — organized technical events and guest lectures',
  'Represented school at inter-school level in Netball, Throwball, and Kabaddi',
]


/* ═══════════════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL + scrollState tracking + glitch trigger
   ═══════════════════════════════════════════════════════════════ */

function useLenisAndScrollTracking(onFastScroll) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = prefersReduced ? null : new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true, touchMultiplier: 1.6,
    })

    let lastY = window.scrollY
    let lastT = performance.now()

    const update = (time) => {
      if (lenis) lenis.raf(time)

      const y = window.scrollY
      const now = performance.now()
      const dt = Math.max(now - lastT, 1)
      const instant = (y - lastY) / dt * 16 // px/frame approx
      lastY = y
      lastT = now

      // smooth the velocity
      scrollState.velocity += (instant - scrollState.velocity) * 0.2
      scrollState.rawVelocity = instant
      scrollState.scrollY = y

      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      scrollState.progress = Math.min(Math.max(y / max, 0), 1)

      // glitch on fast scroll
      if (Math.abs(instant) > 28 && onFastScroll) onFastScroll()

      raf = requestAnimationFrame(update)
    }
    let raf = requestAnimationFrame(update)

    // section tracking via IntersectionObserver
    const observers = SECTION_IDS.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      let idx = SECTION_IDS.indexOf(id)
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              // find this section's position to set active + within-section progress
              const rect = el.getBoundingClientRect()
              const vh = window.innerHeight
              const sectionProgress = Math.min(Math.max((vh / 2 - rect.top) / Math.max(rect.height, 1), 0), 1)
              scrollState.sectionProgress = sectionProgress
              window.__activeSection = idx
              // emit to listeners
              obs.__emit && obs.__emit(idx)
            }
          })
        },
        { threshold: [0.1, 0.4, 0.6, 0.9], rootMargin: '-40% 0px -40% 0px' }
      )
      obs.observe(el)
      obs.__emit = (i) => {
        // call our onSectionChange listeners
        const ev = new CustomEvent('section-change', { detail: i })
        window.dispatchEvent(ev)
      }
      return obs
    })

    return () => {
      cancelAnimationFrame(raf)
      if (lenis) lenis.destroy()
      observers.forEach(o => o && o.disconnect())
    }
  }, [onFastScroll])
}


/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — blood-red tactical targeting reticle
   ═══════════════════════════════════════════════════════════════ */

function Cursor() {
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const ring = ringRef.current, dot = dotRef.current
    if (!ring || !dot) return

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2
    let ringX = mouseX, ringY = mouseY, raf

    const onMove = (e) => { mouseX = e.clientX; mouseY = e.clientY; dot.style.transform = `translate(${mouseX}px, ${mouseY}px)` }
    const loop = () => {
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`
      raf = requestAnimationFrame(loop)
    }
    loop()

    const getH = () => document.querySelectorAll('a, button, .panel, .skill-chip, .nav-toggle, .rail-dot')
    const onEnter = () => ring.classList.add('hover')
    const onLeave = () => ring.classList.remove('hover')
    const onDown = () => ring.classList.add('click')
    const onUp = () => ring.classList.remove('click')

    const t = setTimeout(() => {
      getH().forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave) })
    }, 500)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      clearTimeout(t); cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      getH().forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave) })
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
    </>
  )
}


/* ═══════════════════════════════════════════════════════════════
   SCROLL HUD — bottom-left progress + coords (live, no re-render)
   ═══════════════════════════════════════════════════════════════ */

function ScrollHUD() {
  const pctRef = useRef(null)
  const coordRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    let raf
    const loop = () => {
      const pct = Math.round(scrollState.progress * 100)
      if (pctRef.current) pctRef.current.textContent = String(pct).padStart(2, '0') + '%'
      if (barRef.current) barRef.current.style.transform = `scaleX(${scrollState.progress})`
      // fake tactical coordinates that change with scroll
      if (coordRef.current) {
        const lat = (47.3769 + scrollState.progress * 0.8).toFixed(4)
        const lon = (8.5417 - scrollState.progress * 0.5).toFixed(4)
        coordRef.current.textContent = `LAT ${lat} // LON ${lon}`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="scroll-hud" aria-hidden="true">
      <div className="scroll-hud-row">
        <span className="scroll-hud-label">MISSION PROGRESS</span>
        <span className="scroll-hud-pct" ref={pctRef}>00%</span>
      </div>
      <div className="scroll-hud-bar"><div className="scroll-hud-fill" ref={barRef} /></div>
      <div className="scroll-hud-coord" ref={coordRef}>LAT 47.3769 // LON 8.5417</div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   MISSION RAIL — right-side objective tracker dots
   ═══════════════════════════════════════════════════════════════ */

function MissionRail() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const handler = (e) => setActive(e.detail)
    window.addEventListener('section-change', handler)
    return () => window.removeEventListener('section-change', handler)
  }, [])

  return (
    <div className="mission-rail" aria-hidden="true">
      {SECTION_IDS.map((id, i) => (
        <a key={id} href={`#${id}`} className={`rail-dot ${active === i ? 'active' : ''}`}>
          <span className="rail-label">{String(i + 1).padStart(2, '0')} · {id.toUpperCase()}</span>
        </a>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   GLITCH TEXT
   ═══════════════════════════════════════════════════════════════ */

function GlitchText({ text, className = '' }) {
  return (
    <span className={`glitch ${className}`} data-text={text}>
      {text}
    </span>
  )
}


/* ═══════════════════════════════════════════════════════════════
   SCRAMBLE TEXT
   ═══════════════════════════════════════════════════════════════ */

function useScramble(target, { speed = 40, delay = 0, chars = '!<>-_\\/[]{}=+*^?#01' } = {}) {
  const [output, setOutput] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const queue = target.split('').map(() => ({
      start: Math.floor(Math.random() * 20),
      end: Math.floor(Math.random() * 30) + 20,
    }))
    let frame = 0
    const update = () => {
      frame++
      let done = 0
      const out = target.split('').map((ch, i) => {
        if (frame >= queue[i].start) {
          if (frame >= queue[i].end) { done++; return ch }
          return chars[Math.floor(Math.random() * chars.length)]
        }
        return ''
      }).join('')
      setOutput(out)
      if (done < queue.length) timerRef.current = setTimeout(update, speed)
    }
    const startTimer = setTimeout(update, delay)
    return () => { clearTimeout(startTimer); clearTimeout(timerRef.current) }
  }, [target, speed, delay, chars])

  return output
}


/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════ */

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Reveal({ className = '', stagger = false, children }) {
  const ref = useReveal()
  return <div ref={ref} className={`reveal ${stagger ? 'stagger' : ''} ${className}`}>{children}</div>
}


/* ═══════════════════════════════════════════════════════════════
   BOOT OVERLAY
   ═══════════════════════════════════════════════════════════════ */

function BootOverlay({ onDone }) {
  const [done, setDone] = useState(false)
  const [log, setLog] = useState('')
  const logs = [
    '> INITIALIZING CONTRACT...',
    '> AUTHENTICATING OPERATOR...',
    '> ANURAG_PANDEY :: ACCESS GRANTED',
    '> CLEARANCE LEVEL: ALPHA',
    '> ENGAGING',
  ]
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => { if (i < logs.length) { setLog(logs[i]); i++ } else clearInterval(interval) }, 450)
    const finish = setTimeout(() => { setDone(true); onDone && onDone() }, 2700)
    return () => { clearInterval(interval); clearTimeout(finish) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`boot-overlay ${done ? 'done' : ''}`}>
      <div className="boot-logo">AP</div>
      <div className="boot-bar-wrap"><div className="boot-bar" /></div>
      <div className="boot-log">{log}<span className="cursor-blink" /></div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   HUD CORNERS
   ═══════════════════════════════════════════════════════════════ */
function HudCorners() {
  return (
    <div className="hud-corners" aria-hidden="true">
      <span className="tl" /><span className="tr" /><span className="bl" /><span className="br" />
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════════ */

function Nav({ onGlitch }) {
  const [open, setOpen] = useState(false)
  const links = ['experience', 'projects', 'skills', 'education']
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a href="#hero" className="nav-logo">AP</a>
          <ul className="nav-links">
            {links.map(l => <li key={l}><a href={`#${l}`} onClick={onGlitch}>{l}</a></li>)}
          </ul>
          <div className="nav-status"><span className="dot" /> OPERATIVE ONLINE</div>
          <button className={`nav-toggle ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} aria-label="Toggle navigation"><span /><span /><span /></button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        {links.map(l => <a key={l} href={`#${l}`} onClick={() => setOpen(false)}>{l}</a>)}
      </div>
    </>
  )
}


/* ═══════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════ */

function Hero() {
  const nameScramble = useScramble('ANURAG PANDEY', { speed: 45, delay: 1500 })
  const roleScramble = useScramble('FULL_STACK_OPERATIVE', { speed: 38, delay: 2300 })

  return (
    <section className="hero" id="hero">
      <div className="hero-split">
        <div className="hero-text">
          <Reveal>
            <p className="hero-eyebrow">AVAILABLE FOR CONTRACTS</p>
            <p className="hero-clearance">CLEARANCE: ALPHA · ICA OPERATIVE</p>
            <h1 className="hero-name"><GlitchText text={nameScramble || 'ANURAG PANDEY'} /></h1>
            <p className="hero-role">{roleScramble}<span className="cursor-blink" /></p>
            <p className="hero-description">
              Full stack developer building scalable web applications with
              React, Node.js, and modern technologies. Currently interning at
              Appzeto and pursuing CS at IIST Indore.
            </p>
            <div className="hero-links">
              <a href="mailto:anurag.sky2565@gmail.com" className="hero-link hero-link--primary"><MailIcon /> INITIATE CONTACT</a>
              <a href="https://github.com/anuragpandey4" target="_blank" rel="noopener noreferrer" className="hero-link"><GitHubIcon /> GITHUB</a>
              <a href="https://linkedin.com/in/anurag-pandey4" target="_blank" rel="noopener noreferrer" className="hero-link"><LinkedInIcon /> LINKEDIN</a>
            </div>
          </Reveal>
        </div>
        <div className="hero-3d">
          <Suspense fallback={<div className="hero-3d-fallback" />}>
            <HeroCard3D />
          </Suspense>
        </div>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   EXPERIENCE / PROJECTS / SKILLS / EDUCATION / ACHIEVEMENTS
   ═══════════════════════════════════════════════════════════════ */

function Experience() {
  return (
    <section className="section" id="experience">
      <div className="container">
        <Reveal>
          <div className="section-label">// SERVICE RECORD</div>
          <p className="section-subtitle">DEPLOYMENTS &amp; OPERATIONS</p>
        </Reveal>
        <Reveal stagger>
          {EXPERIENCE.map((exp, i) => (
            <div className="panel" key={i}>
              <span className="dossier-class">FILE 0{i + 1} · CLASSIFIED</span>
              <div className="exp-header">
                <div><div className="exp-role">{exp.role} <span className="exp-company">{exp.company}</span></div></div>
                <span className="exp-date">{exp.date}</span>
              </div>
              <ul className="exp-details">{exp.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section className="section" id="projects">
      <div className="container">
        <Reveal>
          <div className="section-label">// COMPLETED CONTRACTS</div>
          <p className="section-subtitle">TARGETS ELIMINATED &amp; SYSTEMS BUILT</p>
        </Reveal>
        <Reveal stagger>
          {PROJECTS.map((p, i) => (
            <a href={p.link} target="_blank" rel="noopener noreferrer" className="panel project-card" key={i}>
              <span className="dossier-class">CONTRACT 0{i + 1} · CLOSED</span>
              <div className="project-title">
                <span className="project-index">[0{i + 1}]</span>{p.title}<ArrowUpRight />
              </div>
              <p className="project-desc">{p.desc}</p>
              <div className="project-tags">{p.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <Reveal>
          <div className="section-label">// ARSENAL</div>
          <p className="section-subtitle">TOOLS &amp; WEAPONS AT DISPOSAL</p>
        </Reveal>
        <Reveal stagger>
          <div className="panel" style={{ padding: '14px 30px' }}>
            <div className="skills-grid">
              {SKILLS.map((s, i) => (
                <div className="skill-category" key={i}>
                  <span className="skill-label">{s.label}</span>
                  <span className="skill-items">{s.items.map(item => <span className="skill-chip" key={item}>{item}</span>)}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Education() {
  return (
    <section className="section" id="education">
      <div className="container">
        <Reveal>
          <div className="section-label">// TRAINING RECORD</div>
          <p className="section-subtitle">ACADEMY &amp; CERTIFICATION</p>
        </Reveal>
        <Reveal stagger>
          {EDUCATION.map((edu, i) => (
            <div className="panel" key={i}>
              <span className="dossier-class">RECORD 0{i + 1}</span>
              <div className="edu-header">
                <div>
                  <div className="edu-school">{edu.school}</div>
                  <div className="edu-degree">{edu.degree}</div>
                  {edu.detail && <div className="edu-detail">{edu.detail}</div>}
                </div>
                <span className="edu-date">{edu.date}</span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Achievements() {
  return (
    <section className="section" id="achievements">
      <div className="container">
        <Reveal>
          <div className="section-label">// COMMENDATIONS</div>
          <p className="section-subtitle">NOTABLE ACHIEVEMENTS</p>
        </Reveal>
        <Reveal>
          <div className="panel">
            <ul className="achievement-list">{ACHIEVEMENTS.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <span className="footer-text">© 2026 ANURAG PANDEY // CONTRACT CLOSED</span>
          <div className="footer-links">
            <a href="mailto:anurag.sky2565@gmail.com">email</a>
            <a href="https://github.com/anuragpandey4" target="_blank" rel="noopener noreferrer">github</a>
            <a href="https://linkedin.com/in/anurag-pandey4" target="_blank" rel="noopener noreferrer">linkedin</a>
          </div>
        </div>
      </div>
    </footer>
  )
}


/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [booted, setBooted] = useState(false)
  const [glitchKey, setGlitchKey] = useState(0)

  const triggerGlitch = useCallback(() => setGlitchKey(k => k + 1), [])
  useLenisAndScrollTracking(triggerGlitch)

  return (
    <>
      {/* fixed 3D background (lazy) */}
      <Suspense fallback={null}>
        <FixedBackground3D />
      </Suspense>

      {/* 2D overlay layers (CSS) */}
      <div className="bg-aura" aria-hidden="true" />
      <div className="bg-grid-top" aria-hidden="true" />
      <div className="bg-blood" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-scan" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />
      <div className="glitch-overlay" key={glitchKey} aria-hidden="true" />

      {/* fixed UI chrome */}
      <HudCorners />
      <Cursor />
      <ScrollHUD />
      <MissionRail />

      <div className="page-wrapper">
        <Nav onGlitch={triggerGlitch} />
        <main>
          <Hero />
          <Experience />
          <Projects />
          <Skills />
          <Education />
          <Achievements />
        </main>
        <Footer />
      </div>

      {!booted && <BootOverlay onDone={() => setBooted(true)} />}
    </>
  )
}
