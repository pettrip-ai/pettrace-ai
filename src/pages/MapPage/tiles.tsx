import { useEffect, useMemo, useState } from 'react'
import { TileLayer } from 'react-leaflet'
import { useToast } from '../../components/ui/toast-context'
import { OSM_TILE_CANDIDATES } from './constants'

export function TileLayerWithFallback() {
  const { show } = useToast()
  const [activeIdx, setActiveIdx] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  useEffect(() => {
    if (failedCount === 0) return
    if (failedCount >= 3) {
      const nextIdx = Math.min(activeIdx + 1, OSM_TILE_CANDIDATES.length - 1)
      if (nextIdx !== activeIdx) {
        const next = OSM_TILE_CANDIDATES[nextIdx]
        show(`瓦片源切换: ${next.name}`, { kind: 'info', duration: 1500 })
        setActiveIdx(nextIdx)
      }
      setFailedCount(0)
    }
  }, [failedCount, activeIdx, show])

  const active = OSM_TILE_CANDIDATES[activeIdx]

  const handlers = useMemo(
    () => ({
      error: () => setFailedCount((n) => n + 1),
      load: () => setFailedCount(0),
    }),
    [],
  )

  return (
    <TileLayer
      key={active.name}
      url={active.url}
      subdomains={active.subdomains}
      attribution={active.attribution}
      eventHandlers={handlers}
    />
  )
}
