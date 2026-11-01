import { useEffect, useState } from 'react'

/** Validated (CVD-safe) series colours for each mode; readings are neutral context dots. */
export function useChartTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')))
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
    ? { dark, primary: '#0d9488', secondary: '#ea580c', dots: '#94a3b8', grid: '#1e293b', axis: '#94a3b8', shade: '#f43f5e', surface: '#0f172a', text: '#e2e8f0' }
    : { dark, primary: '#0d9488', secondary: '#c2410c', dots: '#64748b', grid: '#e2e8f0', axis: '#64748b', shade: '#f43f5e', surface: '#ffffff', text: '#0f172a' }
}
