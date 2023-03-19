import { useEffect, useState } from 'react'

export function useWindowTheme() {
  const [theme, setTheme] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )
  useEffect(() => {
    if (!window.matchMedia) return
    const listener = (e) => {
      setTheme(e.matches ? 'dark' : 'light')
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener)
    return () =>
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener)
  }, [])
  return theme
}
