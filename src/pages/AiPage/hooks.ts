import { useEffect, useRef, useState } from 'react'

export function useTypewriter(text: string, speed = 12, start = true) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!start) return
    setDisplayed('')
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        return
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed, start])
  return displayed
}

export function useAutoGrow(
  ref: React.MutableRefObject<HTMLTextAreaElement | null>,
  minRows = 1,
  maxRows = 6,
) {
  const minRowsRef = useRef(minRows)
  const maxRowsRef = useRef(maxRows)
  minRowsRef.current = minRows
  maxRowsRef.current = maxRows
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = () => {
      el.style.height = 'auto'
      const lineHeight = parseInt(getComputedStyle(el).lineHeight || '22')
      const max = lineHeight * maxRowsRef.current + 16
      el.style.height = Math.min(el.scrollHeight + 2, max) + 'px'
    }
    resize()
    el.addEventListener('input', resize)
    return () => el.removeEventListener('input', resize)
  }, [ref])
}

export function useScrollToBottom(
  ref: React.MutableRefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
