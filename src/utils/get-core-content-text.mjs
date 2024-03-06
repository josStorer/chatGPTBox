import { getPossibleElementByQuerySelector } from './get-possible-element-by-query-selector.mjs'
import { Readability } from "@mozilla/readability"

const adapters = {
  'scholar.google': ['#gs_res_ccl_mid'],
  google: ['#search'],
  csdn: ['#content_views'],
  bing: ['#b_results'],
  wikipedia: ['#mw-content-text'],
  faz: ['.atc-Text'],
  golem: ['article'],
  eetimes: ['article'],
  'new.qq.com': ['.content-article'],
}

export function getCoreContentText() {
  function getTextFrom(e) {
    return e.innerText || e.textContent
  }

  for (const [siteName, selectors] of Object.entries(adapters)) {
    if (location.hostname.includes(siteName)) {
      const element = getPossibleElementByQuerySelector(selectors)
      if (element) return getTextFrom(element)
      break
    }
  }

  const element = document.querySelector('article')
  if (element) {
    return getTextFrom(element)
  }

  let article = new Readability(document.cloneNode(true), {
    keepClasses: true
  }).parse()
  let content = article.textContent.trim().replaceAll('  ', '').replaceAll('\t', '').replaceAll('\n\n', '').replaceAll(',,', '')
  console.log(content)
  return content
}
