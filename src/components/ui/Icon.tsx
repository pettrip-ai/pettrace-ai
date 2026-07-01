import { useMemo, type ComponentType, type SVGProps } from 'react'
import * as LucideIcons from 'lucide-react'

type IconName = keyof typeof LucideIcons

export type IconLike = string | ComponentType<SVGProps<SVGSVGElement>>

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
  const Comp = useMemo(() => {
    if (!name) return null
    if (typeof name !== 'string') return name as ComponentType<SVGProps<SVGSVGElement>>
    const key = name
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') as IconName
    const Maybe = (LucideIcons as unknown as Record<IconName, ComponentType<SVGProps<SVGSVGElement>> | undefined>)[key]
    return Maybe ?? null
  }, [name])

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
