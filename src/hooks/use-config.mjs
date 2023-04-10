import { useEffect, useState } from 'react'
import { defaultConfig, getUserConfig } from '../config/index.mjs'
import Browser from 'webextension-polyfill'

export function useConfig(initFn, ignoreSession = true) {
  const [config, setConfig] = useState(defaultConfig)
  useEffect(() => {
    getUserConfig().then((config) => {
      setConfig(config)
      if (initFn) initFn()
    })
  }, [])
  useEffect(() => {
    const listener = (changes) => {
      if (ignoreSession) if (Object.keys(changes).length === 1 && 'sessions' in changes) return

      const changedItems = Object.keys(changes)
      let newConfig = {}
      for (const key of changedItems) {
        newConfig[key] = changes[key].newValue
      }
      setConfig({ ...config, ...newConfig })
    }
    Browser.storage.local.onChanged.addListener(listener)
    return () => {
      Browser.storage.local.onChanged.removeListener(listener)
    }
  }, [config])
  return config
}
