import { useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, RoundedBox, Edges, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState } from './scrollState'

/* ═══════════════════════════════════════════════════════════════
   DRIFTING BLOOD EMBERS — additive-blended point cloud
   rises upward like embers/ash, wraps when off-screen
   ═══════════════════════════════════════════════════════════════ */

function Embers({ count = 220 }) {
  const ref = useRef(null)
  const { viewport } = useThree()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 14      // x spread
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10      // y spread
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2   // z depth
    }
    return arr
  }, [count])

  const speeds = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) s[i] = 0.003 + Math.random() * 0.012
    return s
  }, [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i]          // rise
      pos[i * 3]     += Math.sin((performance.now() * 0.0004) + i) * 0.002 // drift
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = -6   // wrap
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    // parallax with scroll progress
    ref.current.position.y = scrollState.progress * 2.5
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff1a2e"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TACTICAL WIRE RING — rotates, reacts to scroll velocity
   ═══════════════════════════════════════════════════════════════ */

function TacticalRing() {
  const g1 = useRef(null)
  const g2 = useRef(null)
  const g3 = useRef(null)

  useFrame((_, delta) => {
    const v = scrollState.velocity
    if (g1.current) {
      g1.current.rotation.z += delta * 0.1 + v * 0.004
      g1.current.rotation.x = THREE.MathUtils.lerp(g1.current.rotation.x, v * 0.02, 0.05)
    }
    if (g2.current) {
      g2.current.rotation.z -= delta * 0.16 + v * 0.006
      g2.current.rotation.y = THREE.MathUtils.lerp(g2.current.rotation.y, v * 0.015, 0.05)
    }
    if (g3.current) {
      g3.current.rotation.x += delta * 0.08
      g3.current.rotation.y += delta * 0.12
      const s = 1 + Math.min(Math.abs(v) * 0.01, 0.3)
      g3.current.scale.setScalar(THREE.MathUtils.lerp(g3.current.scale.x, s, 0.1))
    }
  })

  return (
    <group position={[0, 0, -4]}>
      <group ref={g1}>
        <mesh>
          <torusGeometry args={[3.2, 0.01, 8, 80]} />
          <meshBasicMaterial color="#c8102e" transparent opacity={0.5} />
        </mesh>
      </group>
      <group ref={g2}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[4, 0.008, 8, 100]} />
          <meshBasicMaterial color="#ff1a2e" transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={g3}>
        <mesh>
          <icosahedronGeometry args={[2.4, 1]} />
          <meshBasicMaterial color="#7a0c1c" wireframe transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FIXED BACKGROUND SCENE — full viewport, behind content
   ═════════════════════════════════════════ ember field + wire rings, scroll-reactive */
function FixedSceneInner() {
  const { camera } = useThree()
  useFrame(() => {
    // gentle camera parallax toward scroll direction
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, scrollState.velocity * 0.05, 0.05)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollState.progress * 0.6, 0.05)
    camera.lookAt(0, scrollState.progress * 0.6, -4)
  })
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 2]} intensity={6} color="#ff1a2e" />
      <Embers count={220} />
      <TacticalRing />
    </>
  )
}

export function FixedBackground3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <FixedSceneInner />
    </Canvas>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HERO ID CARD — tactical credential, scroll + pointer reactive
   ═══════════════════════════════════════════════════════════════ */

function makeBarcodeTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = '#e8e2d4'
  let x = 20
  while (x < 492) {
    const w = 1 + Math.floor(Math.random() * 4)
    ctx.fillRect(x, 0, w, 100)
    x += w + 1 + Math.floor(Math.random() * 4)
  }
  ctx.fillStyle = '#e8e2d4'
  ctx.font = '18px monospace'
  ctx.fillText('640172-95-080447', 24, 122)
  return new THREE.CanvasTexture(c)
}

function makeTextTexture(text, color = '#e8e2d4', small = false) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = small ? 80 : 120
  const ctx = c.getContext('2d')
  ctx.fillStyle = color
  ctx.font = `bold ${small ? 36 : 64}px Oswald, sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, c.width / 2, c.height / 2)
  return new THREE.CanvasTexture(c)
}

function Text3DFake({ position, text, color = '#e8e2d4', small = false }) {
  const tex = useMemo(() => makeTextTexture(text, color, small), [text, color, small])
  return (
    <mesh position={position}>
      <planeGeometry args={small ? [1.6, 0.25] : [1, 0.24]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function BarcodePlane() {
  const ref = useRef(null)
  const tex = useMemo(() => makeBarcodeTexture(), [])
  useFrame((state) => {
    if (!ref.current) return
    const { x, y } = state.pointer
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, x * 0.5, 0.05)
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -y * 0.35, 0.05)
  })
  return (
    <mesh ref={ref} position={[0, 0.05, 0.011]}>
      <planeGeometry args={[1.7, 0.45]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function IdCard() {
  const group = useRef(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    // pointer parallax
    let targetY = x * 0.4
    let targetX = -y * 0.25
    // scroll parallax — card lifts & turns as hero scrolls past
    const sp = scrollState.sectionProgress // 0..1 within hero
    targetY += sp * 0.9
    targetX -= sp * 0.3
    // velocity shake on fast scroll
    const v = scrollState.velocity
    targetY += v * 0.003
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06)
    // fast-scroll → card sinks back slightly
    const targetZ = -Math.min(Math.abs(v) * 0.01, 0.5)
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, 0.1)
  })

  return (
    <group ref={group}>
      <RoundedBox args={[2, 3.1, 0.04]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color="#0c0c0c" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      <Edges threshold={15} color="#ff1a2e" />

      <mesh position={[0, 1.18, 0.025]}>
        <planeGeometry args={[2, 0.42]} />
        <meshStandardMaterial color="#c8102e" emissive="#c8102e" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <Text3DFake position={[0, 1.18, 0.03]} text="ICA" color="#0a0a0a" />

      <mesh position={[0, 0.55, 0.025]}>
        <circleGeometry args={[0.5, 48]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0.027]}>
        <circleGeometry args={[0.46, 48]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.62, 0.029]}>
        <circleGeometry args={[0.16, 32]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 0.34, 0.029]}>
        <circleGeometry args={[0.27, 32]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <Text3DFake position={[0, -0.08, 0.03]} text="ANURAG PANDEY" color="#e8e2d4" small />
      <Text3DFake position={[0, -0.22, 0.03]} text="CLEARANCE: ALPHA" color="#c8102e" small />
      <BarcodePlane />

      <mesh position={[0, -1.32, 0.025]}>
        <planeGeometry args={[2, 0.06]} />
        <meshStandardMaterial color="#c8102e" emissive="#c8102e" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function HeroCard3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 4]} intensity={40} color="#ff1a2e" />
      <pointLight position={[-3, -2, 3]} intensity={20} color="#ffffff" />
      <spotLight position={[0, 4, 6]} angle={0.4} penumbra={1} intensity={30} color="#ffffff" />
      <Float speed={2.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <IdCard />
      </Float>
    </Canvas>
  )
}
