import { useWindowSize } from './use-window-size.mjs'

export function useClampWindowSize(widthRange = [0, Infinity], heightRange = [0, Infinity]) {
  const windowSize = useWindowSize()
  windowSize[0] = Math.min(widthRange[1], Math.max(windowSize[0], widthRange[0]))
  windowSize[1] = Math.min(heightRange[1], Math.max(windowSize[1], heightRange[0]))
  return windowSize
}
