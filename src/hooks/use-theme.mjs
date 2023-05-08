import { useConfig } from './use-config.mjs'
import { useWindowTheme } from './use-window-theme.mjs'

export function useTheme() {
  const config = useConfig()
  const theme = useWindowTheme()
  return [config.themeMode === 'auto' ? theme : config.themeMode, config]
}
