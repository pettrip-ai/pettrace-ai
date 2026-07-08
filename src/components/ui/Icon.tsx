import type { ComponentType, SVGProps } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Inbox,
  Info,
  PawPrint,
  SearchX,
} from 'lucide-react'

const ICON_REGISTRY = {
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  inbox: Inbox,
  info: Info,
  'paw-print': PawPrint,
  'search-x': SearchX,
} as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>

export type IconLike = string | ComponentType<SVGProps<SVGSVGElement>>

function normalizeIconName(name: string) {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function Icon({
  name,
  size = 20,
  className = '',
  color,
  strokeWidth = 2,
}: {
  name?: IconLike
  size?: number
  className?: string
  color?: string
  strokeWidth?: number
}) {
  const Comp = name
    ? typeof name === 'string'
      ? ICON_REGISTRY[normalizeIconName(name)] ?? null
      : name
    : null

  if (!Comp) return null
  return (
    <Comp
      {...({
        width: size,
        height: size,
        className,
        color,
        strokeWidth,
      } as SVGProps<SVGSVGElement>)}
    />
  )
}
