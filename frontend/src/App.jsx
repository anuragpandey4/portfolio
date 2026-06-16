import { useEffect, useRef, useState } from 'react'

// ─── Icons (inline SVGs to avoid deps) ───────────────────

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


// ─── Globe ───────────────────────────────────────────────

function Globe() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef(null)
  const scrollRef = useRef(0)
  const hoverRef = useRef(false)

  const DOT_COUNT = 800
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

  // generate fibonacci sphere points with scatter offsets
  const points = useRef((() => {
    const pts = []
    for (let i = 0; i < DOT_COUNT; i++) {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = GOLDEN_ANGLE * i
      const nx = Math.cos(theta) * radiusAtY
      const ny = y
      const nz = Math.sin(theta) * radiusAtY

      // random scatter: outward along normal + random tangent offset
      const scatterStrength = 0.3 + Math.random() * 0.9
      const tangentAngle = Math.random() * Math.PI * 2
      const tangentStrength = (Math.random() - 0.5) * 0.4

      pts.push({
        // original sphere position (unit sphere)
        x: nx, y: ny, z: nz,
        // scatter displacement vector
        sx: nx * scatterStrength + Math.cos(tangentAngle) * tangentStrength,
        sy: ny * scatterStrength + Math.sin(tangentAngle) * tangentStrength,
        sz: nz * scatterStrength + Math.cos(tangentAngle + 1) * tangentStrength,
        // current animated offset (starts at 0)
        cx: 0, cy: 0, cz: 0,
      })
    }
    return pts
  })())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let dpr = 1

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
    }
    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }
    const handleEnter = () => { hoverRef.current = true }
    const handleLeave = () => { hoverRef.current = false }

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('scroll', handleScroll, { passive: true })
    canvas.addEventListener('mouseenter', handleEnter)
    canvas.addEventListener('mouseleave', handleLeave)

    let rotY = 0
    let rotX = 0.3

    let targetRotSpeedY = 0.002
    let targetTiltX = 0.3

    // scatter animation factor: 0 = sphere, 1 = scattered
    let scatterFactor = 0

    const animate = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const scroll = scrollRef.current
      const mouse = mouseRef.current
      const isHovering = hoverRef.current

      ctx.clearRect(0, 0, w, h)

      const radius = Math.min(w, h) * 0.38
      const centerX = w * 0.5
      const centerY = h * 0.5
      const perspective = 600

      // scroll fade
      const fadeStart = 100
      const fadeEnd = 500
      const scrollOpacity = Math.max(0, Math.min(1, 1 - (scroll - fadeStart) / (fadeEnd - fadeStart)))
      if (scrollOpacity <= 0) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      // scatter: lerp toward target
      const scatterTarget = isHovering ? 1 : 0
      scatterFactor += (scatterTarget - scatterFactor) * (isHovering ? 0.06 : 0.035)

      // mouse influence on rotation
      targetRotSpeedY = 0.0015 + (mouse.x - 0.5) * 0.006
      targetTiltX = 0.3 + (mouse.y - 0.5) * 0.5

      rotY += targetRotSpeedY
      rotX += (targetTiltX - rotX) * 0.03

      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)

      const projected = []

      for (const pt of points.current) {
        // lerp each dot's current offset toward target
        const targetCx = pt.sx * scatterFactor
        const targetCy = pt.sy * scatterFactor
        const targetCz = pt.sz * scatterFactor
        pt.cx += (targetCx - pt.cx) * 0.08
        pt.cy += (targetCy - pt.cy) * 0.08
        pt.cz += (targetCz - pt.cz) * 0.08

        // apply scatter offset to sphere position
        const px = pt.x + pt.cx
        const py = pt.y + pt.cy
        const pz = pt.z + pt.cz

        // rotate around Y
        let x = px * cosY + pz * sinY
        let z = -px * sinY + pz * cosY

        // rotate around X (tilt)
        let y = py * cosX - z * sinX
        z = py * sinX + z * cosX

        // perspective projection
        const scale = perspective / (perspective + z * radius)
        const screenX = centerX + x * radius * scale
        const screenY = centerY + y * radius * scale

        // depth
        const depth = (z + 1) / 2
        const dotSize = (0.6 + depth * 1.8) * scale
        const dotOpacity = (0.08 + depth * 0.55) * scrollOpacity

        if (depth > 0.05) {
          projected.push({ screenX, screenY, dotSize, dotOpacity, depth })
        }
      }

      projected.sort((a, b) => a.depth - b.depth)

      for (const dot of projected) {
        ctx.beginPath()
        ctx.arc(dot.screenX, dot.screenY, dot.dotSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 195, 185, ${dot.dotOpacity})`
        ctx.fill()
      }

      // equator ring (fade out when scattered)
      const ringOpacity = 0.04 * scrollOpacity * (1 - scatterFactor)
      if (ringOpacity > 0.001) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(255, 255, 255, ${ringOpacity})`
        ctx.lineWidth = 0.5
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2
          const px = Math.cos(angle)
          const pz = Math.sin(angle)

          let rx = px * cosY + pz * sinY
          let rz = -px * sinY + pz * cosY
          let ry = -rz * sinX
          rz = rz * cosX

          const s = perspective / (perspective + rz * radius)
          const sx = centerX + rx * radius * s
          const sy = centerY + ry * radius * s

          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('scroll', handleScroll)
      canvas.removeEventListener('mouseenter', handleEnter)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      aria-hidden="true"
    />
  )
}


// ─── Scroll Reveal Hook ──────────────────────────────────

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Reveal({ className = '', stagger = false, children }) {
  const ref = useReveal()
  return (
    <div ref={ref} className={`reveal ${stagger ? 'stagger' : ''} ${className}`}>
      {children}
    </div>
  )
}


// ─── Data ────────────────────────────────────────────────

const EXPERIENCE = [
  {
    role: 'Full Stack Developer Intern',
    company: 'Appzeto',
    location: 'Indore',
    date: 'Jun 2026 — Present',
    points: [
      'Collaborating on the development of scalable web applications using modern full-stack technologies.',
      'Assisting in building responsive frontend interfaces and integrating robust backend services.',
    ],
  },
  {
    role: 'Technical Content Writer (Python)',
    company: 'JD Bots',
    date: '2021',
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
  { label: 'languages', items: 'C, C++, JavaScript, Python, Solidity, HTML, CSS' },
  { label: 'frameworks', items: 'React.js, Node.js, Express.js, Tailwind CSS, WebSockets' },
  { label: 'databases', items: 'MongoDB, Mongoose, MySQL' },
  { label: 'tools', items: 'Git, GitHub, Jest, Jira, Mermaid, Markdown' },
]

const EDUCATION = [
  {
    school: 'IIST, Indore',
    degree: 'B.Tech in Computer Science & Engineering — 3rd Year',
    date: '2023 — 2027',
    detail: 'CGPA: 8.22',
  },
  {
    school: 'Sky Heights Academy, Betma',
    degree: 'Class XII — 90.0% · Class X — 96.2%',
    date: 'CBSE',
    detail: null,
  },
]

const ACHIEVEMENTS = [
  'Responsive Web Design certification — 300 hours, freeCodeCamp',
  'Won the Model Parliament (MOP) competition — Lexicon Club',
  'Core Member of ACM Chapter at IIST Indore — organized technical events and guest lectures',
  'Represented school at inter-school level in Netball, Throwball, and Kabaddi',
]


// ─── Components ──────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false)
  const links = ['experience', 'projects', 'skills', 'education']

  return (
    <>
      <nav className="nav" id="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">AP</a>
          <ul className="nav-links">
            {links.map(l => (
              <li key={l}><a href={`#${l}`}>{l}</a></li>
            ))}
          </ul>
          <button
            className={`nav-toggle ${open ? 'active' : ''}`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            id="nav-toggle"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? 'open' : ''}`} id="mobile-menu">
        {links.map(l => (
          <a key={l} href={`#${l}`} onClick={() => setOpen(false)}>{l}</a>
        ))}
      </div>
    </>
  )
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-split">
        <div className="hero-text">
          <Reveal>
            <p className="hero-eyebrow">
              <span className="status-dot" />
              Available for opportunities
            </p>
            <h1 className="hero-name">Anurag Pandey</h1>
            <p className="hero-description">
              Full stack developer building scalable web applications with
              React, Node.js, and modern technologies. Currently interning at
              Appzeto and pursuing CS at IIST Indore.
            </p>
            <div className="hero-links">
              <a href="mailto:anurag.sky2565@gmail.com" className="hero-link hero-link--primary" id="hero-email">
                <MailIcon /> Get in touch
              </a>
              <a href="https://github.com/anuragpandey4" target="_blank" rel="noopener noreferrer" className="hero-link" id="hero-github">
                <GitHubIcon /> GitHub
              </a>
              <a href="https://linkedin.com/in/anurag-pandey4" target="_blank" rel="noopener noreferrer" className="hero-link" id="hero-linkedin">
                <LinkedInIcon /> LinkedIn
              </a>
            </div>
          </Reveal>
        </div>
        <div className="hero-globe">
          <Globe />
        </div>
      </div>
    </section>
  )
}

function Experience() {
  return (
    <section className="section" id="experience">
      <div className="container">
        <Reveal>
          <div className="section-label">Experience</div>
        </Reveal>
        <Reveal stagger>
          {EXPERIENCE.map((exp, i) => (
            <div className="exp-card" key={i}>
              <div className="exp-header">
                <div>
                  <div className="exp-role">
                    {exp.role} <span className="exp-company">@ {exp.company}</span>
                  </div>
                </div>
                <span className="exp-date">{exp.date}</span>
              </div>
              <ul className="exp-details">
                {exp.points.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
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
          <div className="section-label">Projects</div>
        </Reveal>
        <Reveal stagger>
          {PROJECTS.map((p, i) => (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card"
              key={i}
              id={`project-${i}`}
            >
              <div className="project-title">
                {p.title}
                <ArrowUpRight />
              </div>
              <p className="project-desc">{p.desc}</p>
              <div className="project-tags">
                {p.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
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
          <div className="section-label">Skills</div>
        </Reveal>
        <Reveal stagger>
          <div className="skills-grid">
            {SKILLS.map((s, i) => (
              <div className="skill-category" key={i}>
                <span className="skill-label">{s.label}</span>
                <span className="skill-items">{s.items}</span>
              </div>
            ))}
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
          <div className="section-label">Education</div>
        </Reveal>
        <Reveal stagger>
          {EDUCATION.map((edu, i) => (
            <div className="edu-card" key={i}>
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
          <div className="section-label">Achievements</div>
        </Reveal>
        <Reveal>
          <ul className="achievement-list">
            {ACHIEVEMENTS.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-content">
          <span className="footer-text">© 2026 Anurag Pandey</span>
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


// ─── App ─────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <div className="grid-bg" aria-hidden="true" />
      <div className="page-wrapper">
        <Nav />
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
    </>
  )
}