import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface VirtualFeedOptions<T> {
  items: T[]
  containerRef: React.RefObject<HTMLDivElement | null>
  itemHeightEstimate?: number
  visibleCount?: number
  preload?: number
}

export function useVirtualFeed<T>({
  items,
  containerRef,
  itemHeightEstimate = 180,
  visibleCount = 18,
  preload = 6,
}: VirtualFeedOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const totalH = items.length * itemHeightEstimate

  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeightEstimate) - preload)
  const windowSize = visibleCount + preload * 2
  const endIdx = Math.min(items.length, startIdx + windowSize)
  const visible = useMemo(() => items.slice(startIdx, endIdx), [items, startIdx, endIdx])
  const offsetPx = startIdx * itemHeightEstimate

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const ent of entries) {
        setViewportH(ent.contentRect.height)
      }
    })
    ro.observe(el)
    setViewportH(el.clientHeight)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [containerRef, onScroll])

  useEffect(() => {
    if (!sentinelRef.current) return
    if (!containerRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            onScroll()
          }
        }
      },
      { root: containerRef.current, rootMargin: '200px 0px 200px 0px', threshold: 0 },
    )
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [containerRef, onScroll, items.length])

  return {
    visible,
    offsetPx,
    offsetIndex: startIdx,
    total: items.length,
    totalH,
    viewportH,
    itemHeightEstimate,
    sentinelRef,
  }
}
