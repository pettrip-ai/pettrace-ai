import clsx from 'clsx'
import { Icon, type IconLike } from './Icon'

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  icon?: IconLike
  emoji?: string
  title?: string
  description?: string
  cta?: string
  onCta?: () => void
  action?: React.ReactNode
  tone?: 'default' | 'muted'
  className?: string
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  cta,
  onCta,
  action,
  tone = 'default',
  className,
}: EmptyStateProps) {
  const bg = tone === 'muted' ? 'var(--pettrace-mint-50)' : 'var(--pettrace-coral-50)'
  const iconColor = tone === 'muted' ? 'var(--accent)' : 'var(--pettrace-coral-500)'

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {/* Icon container: 96x96 circle */}
      <div style={{ width: 96, height: 96, borderRadius: 'var(--radius-full)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {emoji ? (
          <span style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</span>
        ) : icon ? (
          <Icon name={icon} size={40} color={iconColor} />
        ) : (
          <Icon name="inbox" size={40} color={iconColor} />
        )}
      </div>

      {/* Title */}
      {title && (
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-h4)', color: 'var(--foreground)', marginTop: 16, textAlign: 'center' }}>
          {title}
        </p>
      )}

      {/* Description */}
      {description && (
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', textAlign: 'center', maxWidth: 240, marginTop: 6, lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {/* CTA button */}
      {cta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 20,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            height: 40,
            padding: '0 24px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {cta}
        </button>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PlaceholderHero                                                    */
/* ------------------------------------------------------------------ */

interface PlaceholderHeroProps {
  label?: string
  description?: string
}

export function PlaceholderHero({
  label = '功能开发中',
  description = '我们正在为你准备更多惊喜内容，敬请期待',
}: PlaceholderHeroProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: 'var(--radius-full)', background: 'var(--pettrace-coral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="paw-print" size={40} color="var(--pettrace-coral-500)" />
      </div>
      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-h4)', color: 'var(--foreground)', marginTop: 16, textAlign: 'center' }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', textAlign: 'center', maxWidth: 240, marginTop: 6, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Loading                                                            */
/* ------------------------------------------------------------------ */

function ShimmerBlock({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, var(--border) 25%, var(--surface-container-low) 50%, var(--border) 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}

function SkeletonPost() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 14, boxShadow: 'var(--shadow-1)' }}>
      {/* Avatar + text rows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShimmerBlock style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <ShimmerBlock style={{ width: 80, height: 12, borderRadius: 20 }} />
          <ShimmerBlock style={{ width: 40, height: 12, borderRadius: 20 }} />
        </div>
      </div>
      {/* Image placeholder */}
      <ShimmerBlock style={{ width: '100%', height: 96, borderRadius: 'var(--radius-md)', marginTop: 12 }} />
      {/* Text rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
        <ShimmerBlock style={{ width: '100%', height: 12, borderRadius: 20 }} />
        <ShimmerBlock style={{ width: '75%', height: 12, borderRadius: 20 }} />
        <ShimmerBlock style={{ width: '50%', height: 12, borderRadius: 20 }} />
      </div>
      {/* Bottom interaction bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShimmerBlock style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <ShimmerBlock style={{ width: 28, height: 10, borderRadius: 20 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonPlace() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 14, boxShadow: 'var(--shadow-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShimmerBlock style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <ShimmerBlock style={{ width: 96, height: 12, borderRadius: 20 }} />
          <ShimmerBlock style={{ width: 64, height: 12, borderRadius: 20 }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <ShimmerBlock style={{ width: 12, height: 12, borderRadius: '50%' }} />
        <ShimmerBlock style={{ width: 32, height: 12, borderRadius: 20 }} />
      </div>
      <ShimmerBlock style={{ width: '100%', height: 40, borderRadius: 20, marginTop: 16 }} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 14, boxShadow: 'var(--shadow-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ShimmerBlock style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <ShimmerBlock style={{ width: 64, height: 12, borderRadius: 20 }} />
          <ShimmerBlock style={{ width: 96, height: 12, borderRadius: 20 }} />
          <ShimmerBlock style={{ width: 48, height: 12, borderRadius: 20 }} />
        </div>
      </div>
      <ShimmerBlock style={{ width: 64, height: 20, borderRadius: 20, marginTop: 14 }} />
    </div>
  )
}

export function Loading({
  label = '加载中…',
  variant = 'default',
}: {
  label?: string
  variant?: 'default' | 'shimmer' | 'card' | 'post' | 'place'
}) {
  if (variant === 'post') return <SkeletonPost />
  if (variant === 'place') return <SkeletonPlace />
  if (variant === 'card') return <SkeletonCard />

  if (variant === 'shimmer') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: 'var(--radius-full)', background: 'var(--pettrace-coral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
          <Icon name="paw-print" size={40} color="var(--pettrace-coral-500)" />
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted-foreground)' }}>{label}</p>
      </div>
    )
  }

  // default spinner
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid color-mix(in srgb, var(--pettrace-coral-500) 15%, transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted-foreground)' }}>{label}</p>
    </div>
  )
}
