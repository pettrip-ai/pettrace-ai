import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
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
          onClick={() => navigate(AI.path)}
          aria-label={AI.label}
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

function DesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const items = [
    { key: 'map', label: '宠物友好地图', path: '/map', icon: Map },
    { key: 'ai', label: 'AI 行程规划', path: '/ai', icon: Dog, primary: true },
    { key: 'community', label: '真实验证社区', path: '/community', icon: Users },
    { key: 'pet', label: '宠物档案 & 护理', path: '/pet', icon: PawPrint },
    { key: 'settings', label: '设置', path: '/settings', icon: Settings },
  ]
  return (
    <aside
      className={clsx(
        'sticky self-start shrink-0 transition-[width] duration-300 overflow-hidden',
        'mt-4 ml-4 h-[calc(100vh-2rem-1px)] rounded-xl',
        collapsed ? 'w-[64px]' : 'w-[256px]',
      )}
      style={{
        background: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: 'var(--shadow-1)',
        padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-h4)', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap', padding: 'var(--space-2) var(--space-3)' }}>
        {collapsed ? '迹' : '宠迹AI'}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {items.map(n => {
          const Icon = n.icon
          const active = loc.pathname === n.path || loc.pathname.startsWith(n.path + '/')
          return (
            <button
              key={n.key}
              onClick={() => navigate(n.path)}
              className={clsx(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-left transition whitespace-nowrap text-sm',
                active && n.primary
                  ? 'bg-coral-50 text-primary-deep font-semibold'
                  : active
                    ? 'bg-coral-50 text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-container-low',
                collapsed && 'justify-center px-1',
              )}
            >
              <Icon size={20} className={clsx('shrink-0', active && n.primary && 'text-primary')} />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </button>
          )
        })}
      </div>
      <button
        onClick={onToggle}
        className="mt-auto text-xs text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-surface-container-low"
      >
        {collapsed ? '→' : '< 收起'}
      </button>
    </aside>
  )
}

function DesktopLayout() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="min-h-screen h-screen flex flex-col bg-bg">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function MobileLayout() {
  const location = useLocation()
  const hideBar = DEPTH1_NO_BAR.has(location.pathname) || DEPTH2_NO_BAR.has(location.pathname)

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-bg">
      <main
        className="flex flex-col w-full"
        style={{
          height: hideBar ? '100dvh' : 'calc(100dvh - 84px)',
          flexShrink: 0,
        }}
      >
        <Outlet />
      </main>
      {!hideBar && <MobileTabBar />}
    </div>
  )
}

export default function AppLayout() {
  const isDesktop = useIsDesktop()
  return <>{isDesktop ? <DesktopLayout /> : <MobileLayout />}</>
}
