import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Map, Users, Dog, PawPrint, Settings } from 'lucide-react'

const NAV = [
  { key: 'map', label: '地图', path: '/map', icon: Map },
  { key: 'community', label: '社区', path: '/community', icon: Users },
  { key: 'pet', label: '档案', path: '/pet', icon: PawPrint },
  { key: 'settings', label: '设置', path: '/settings', icon: Settings },
]
const AI = { key: 'ai', label: 'AI规划', path: '/ai', icon: Dog }

const BREAKPOINT = 768

const DEPTH1_NO_BAR = new Set<string>([])
const DEPTH2_NO_BAR = new Set<string>(['/ai/chat', '/community/post'])

function useIsDesktop() {
  const getInitial = () => typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT : false
  const [isDesktop, setIsDesktop] = useState(getInitial)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

function MobileTabBar() {
  const loc = useLocation()
  const navigate = useNavigate()

  const hiddenPaths = ['/ai/chat', '/community/post']
  const hideBar = hiddenPaths.some((p) => loc.pathname === p || loc.pathname.startsWith(p + '/'))

  const aiActive = loc.pathname.startsWith('/ai')

  if (hideBar) return null

  return (
    <nav
      role="tablist"
      aria-label="主导航"
      className="fixed z-[80] rounded-full"
      style={{
        bottom: 'calc(8px + var(--sab, 0px))',
        left: '12px',
        right: '12px',
        height: 60,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 8px 32px rgba(84,49,31,0.12), 0 2px 8px rgba(84,49,31,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {NAV.slice(0, 2).map(n => {
        const Icon = n.icon
        const active = loc.pathname.startsWith(n.path)
        return (
          <a
            key={n.key}
            role="tab"
            aria-selected={active}
            className="mobile-tab-link"
            href={`#${n.path}`}
            onClick={(e) => { e.preventDefault(); navigate(n.path) }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              flex: 1, color: active ? 'var(--primary)' : 'var(--muted)',
              textDecoration: 'none', fontSize: 10, fontWeight: 500,
              fontFamily: 'var(--font-body)', transition: 'color .15s', paddingBottom: 4,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span>{n.label}</span>
          </a>
        )
      })}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, paddingBottom: 4 }}>
        <button
          type="button"
          onClick={() => navigate(AI.path)}
          aria-label={AI.label}
          className="mobile-ai-tab-button"
          style={{
            width: 46, height: 46, minWidth: 46, borderRadius: 'var(--radius-full)',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(247,107,122,0.35)',
            border: 'none', marginTop: -22,
          }}
        >
          <Dog size={22} strokeWidth={2.2} />
        </button>
        <span style={{ fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-body)', color: aiActive ? 'var(--primary)' : 'var(--muted)' }}>{AI.label}</span>
      </div>

      {NAV.slice(2).map(n => {
        const Icon = n.icon
        const active = loc.pathname.startsWith(n.path)
        return (
          <a
            key={n.key}
            role="tab"
            aria-selected={active}
            className="mobile-tab-link"
            href={`#${n.path}`}
            onClick={(e) => { e.preventDefault(); navigate(n.path) }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              flex: 1, color: active ? 'var(--primary)' : 'var(--muted)',
              textDecoration: 'none', fontSize: 10, fontWeight: 500,
              fontFamily: 'var(--font-body)', transition: 'color .15s', paddingBottom: 4,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span>{n.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

function MobileLayout({ simulated = false }: { simulated?: boolean }) {
  const location = useLocation()
  const hideBar = DEPTH1_NO_BAR.has(location.pathname) || DEPTH2_NO_BAR.has(location.pathname)
  const isMapRoute = location.pathname === '/map'
  const isChatRoute = location.pathname === '/ai/chat'
  const needsTopInset = !isMapRoute && !isChatRoute

  const h = simulated ? '100%' : '100dvh'

  return (
    <div className="relative w-full overflow-hidden bg-bg" style={{ height: h }}>
      <main
        className="flex flex-col w-full min-h-0"
        style={{
          height: hideBar ? h : simulated ? 'calc(100% - 84px)' : 'calc(100dvh - 84px)',
          paddingTop: needsTopInset ? 'var(--sat, 0px)' : 0,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <Outlet />
      </main>
      {!hideBar && <MobileTabBar />}
    </div>
  )
}

function DesktopLayout() {
  return (
    <div
      className="min-h-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#f0ece6' }}
    >
      {/* Phone simulator frame */}
      <div
        style={{
          width: 393,
          height: 852,
          borderRadius: 40,
          background: '#1a1a1a',
          padding: 12,
          boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        {/* Notch / dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126,
            height: 34,
            borderRadius: 20,
            background: '#1a1a1a',
            zIndex: 10,
          }}
        />
        {/* Screen — transform creates a new containing block so fixed positioning is scoped */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 28,
            overflow: 'hidden',
            position: 'relative',
            transform: 'translateZ(0)',
            // Override safe-area-top to simulate Dynamic Island height
            '--sat': '54px',
          } as React.CSSProperties}
        >
          <MobileLayout simulated />
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const isDesktop = useIsDesktop()
  return <>{isDesktop ? <DesktopLayout /> : <MobileLayout />}</>
}
