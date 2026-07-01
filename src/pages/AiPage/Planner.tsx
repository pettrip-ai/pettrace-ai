import { Coffee, TreePine, ShoppingBag, Stethoscope, MapPin, PawPrint, ChevronDown, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

type Icon = typeof Coffee

const TRIP_CARDS = [
  {
    tag: '推荐', tagActive: true,
    title: '朝阳咖啡遛弯路线',
    desc: '朝阳大悦城 → 毛孩子咖啡 → 公园散步',
    distance: '1.2km',
    icon: Coffee as Icon,
    iconBg: 'var(--color-primary-container)',
    iconColor: 'var(--color-primary)',
  },
  {
    tag: '周末', tagActive: false,
    title: '望京宠物公园半日游',
    desc: '宠物医院体检 → 望京公园 → 汪星人咖啡',
    distance: '3.1km',
    icon: TreePine as Icon,
    iconBg: 'var(--pettrace-mint-50)',
    iconColor: 'var(--color-accent)',
  },
]

const HOT_DEST_CATS = [
  { key: 'all', label: '全部', active: true },
  { key: 'cafe', label: '咖啡厅', active: false },
  { key: 'park', label: '宠物公园', active: false },
  { key: 'vet', label: '宠物医院', active: false },
  { key: 'shop', label: '宠物商店', active: false },
]

const HOT_DEST = [
  { name: '毛孩子咖啡工坊', sub: '大悦城 B1 · 1.2km', icon: Coffee as Icon, iconBg: 'var(--color-primary-container)', iconColor: 'var(--color-primary)' },
  { name: '朝阳宠物友好公园', sub: '朝阳公园东门 · 2.5km', icon: TreePine as Icon, iconBg: 'var(--pettrace-mint-50)', iconColor: 'var(--color-accent)' },
  { name: 'PAWPAW 宠物商城', sub: '三里屯太古里 · 2.8km', icon: ShoppingBag as Icon, iconBg: 'var(--pettrace-honey-50)', iconColor: 'var(--color-warning)' },
  { name: '瑞派宠物医院', sub: '望京 SOHO · 3.1km', icon: Stethoscope as Icon, iconBg: 'var(--pettrace-error-50)', iconColor: 'var(--color-error)' },
]

export default function PlannerPage() {
  const { pets, clearChat } = useStore()
  const navigate = useNavigate()
  const pet = pets[0]

  const hourGreeting = (() => {
    const h = new Date().getHours()
    if (h < 6) return '凌晨好'
    if (h < 12) return '上午好'
    if (h < 14) return '下午好'
    if (h < 19) return '下午好'
    return '晚上好'
  })()

  const petLabel = pet ? pet.name : '豆豆'

  function sendChat() {
    clearChat()
    navigate({ pathname: '/ai/chat' })
  }
  function pickTrip(title: string) {
    clearChat()
    navigate({ pathname: '/ai/chat', search: `q=${encodeURIComponent(`帮我规划: ${title}`)}` })
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg" style={{ paddingBottom: 170 }}>
      <div className="flex flex-col px-4 pt-6">
        <header className="flex items-center justify-between py-3">
          <div>
            <h1 className="pettrace-h3 truncate" style={{ margin: 0, fontSize: 24, color: 'var(--color-on-surface)' }}>
              {hourGreeting}，铲屎官
            </h1>
            <p className="pettrace-body truncate" style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--color-muted-foreground)' }}>
              今天想带{petLabel}去哪里玩？
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="avatar gradient md" title={petLabel} style={{ cursor: 'pointer' }}>{petLabel.slice(0, 1)}</div>
            <ChevronDown size={14} style={{ color: 'var(--color-on-surface-variant)' }} />
          </div>
        </header>

        <section className="mb-5">
          <h2 className="pettrace-h4 truncate" style={{ margin: '0 0 12px', color: 'var(--color-on-surface)', fontSize: 20 }}>推荐行程</h2>

          {TRIP_CARDS.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} className="card mb-3" style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }} onClick={() => pickTrip(c.title)}>
                <div className="flex">
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={c.tagActive ? 'chip active' : 'chip inactive'} style={{ minWidth: 'auto', padding: '2px 10px', fontSize: 11 }}>{c.tag}</span>
                      <span className="pettrace-caption" style={{ color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap', fontSize: 11 }}>约{c === TRIP_CARDS[0] ? '2' : '3'}小时</span>
                    </div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}>{c.title}</h3>
                    <p className="pettrace-caption truncate" style={{ color: 'var(--color-muted-foreground)', margin: 0 }}>{c.desc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin size={12} style={{ color: 'var(--color-on-surface-variant)' }} />
                      <span className="pettrace-caption" style={{ color: 'var(--color-on-surface-variant)', fontSize: 12 }}>{c.distance}</span>
                      <span style={{ color: 'var(--color-outline)', margin: '0 4px' }}>·</span>
                      <PawPrint size={12} style={{ color: 'var(--color-accent)' }} />
                      <span className="pettrace-caption" style={{ color: 'var(--color-accent)', fontSize: 12 }}>宠物友好</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 88, background: c.iconBg }}>
                    <Icon size={32} style={{ color: c.iconColor }} />
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        <section className="mb-5">
          <div className="px-0 mb-3">
            <h2 className="pettrace-h4 truncate" style={{ margin: 0, color: 'var(--color-on-surface)', fontSize: 20 }}>热门目的地</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
            {HOT_DEST_CATS.map(c => (
              <button key={c.key} className={c.active ? 'chip active' : 'chip inactive'} style={{ fontSize: 12 }}>{c.label}</button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {HOT_DEST.map((d, i) => {
              const Icon = d.icon
              return (
                <div key={i} className="card shrink-0" style={{ width: 160, padding: 0, cursor: 'pointer', overflow: 'hidden' }}>
                  <div className="flex items-center justify-center" style={{ height: 96, background: d.iconBg }}>
                    <Icon size={36} style={{ color: d.iconColor }} />
                  </div>
                  <div style={{ padding: 12 }}>
                    <p style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: 14, margin: '0 0 2px', fontFamily: 'var(--font-heading)' }} className="truncate">{d.name}</p>
                    <p className="pettrace-caption truncate" style={{ color: 'var(--color-muted-foreground)', margin: 0, fontSize: 12 }}>{d.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div
        className="fixed z-40"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          left: 16,
          right: 16,
          padding: '0 0 0',
        }}
      >
        <div
          className="chat-wrap"
          style={{
            maxWidth: '100%',
            minWidth: 0,
            boxShadow: 'var(--shadow-3)',
            alignItems: 'center',
          }}
          onClick={sendChat}
        >
          <PawPrint size={18} style={{ color: 'var(--primary)', opacity: 1, flexShrink: 0 }} />
          <input
            className="chat-input"
            type="text"
            placeholder="告诉AI你想去哪里..."
            readOnly
            style={{ flex: 1, minWidth: 0, height: 20, lineHeight: '20px', cursor: 'text' }}
          />
          <button className="chat-send" aria-label="发送"><Send size={16} /></button>
        </div>
      </div>
    </div>
  )
}
