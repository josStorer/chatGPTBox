import { getPossibleElementByQuerySelector } from './get-possible-element-by-query-selector.mjs'

function getArea(e) {
  const rect = e.getBoundingClientRect()
  return rect.width * rect.height
}

const adapters = {
  'scholar.google': ['#gs_res_ccl_mid'],
  google: ['#search'],
  csdn: ['#content_views'],
  bing: ['#b_results'],
  wikipedia: ['#mw-content-text'],
  faz: ['.atc-Text'],
}

function findLargestElement(e) {
  if (!e) {
    return null
  }
  let maxArea = 0
  let largestElement = null
  const limitedArea = 0.8 * getArea(e)

  function traverseDOM(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const area = getArea(node)

      if (area > maxArea && area < limitedArea) {
        maxArea = area
        largestElement = node
      }

      Array.from(node.children).forEach(traverseDOM)
    }
  }

  traverseDOM(e)
  return largestElement
}

export function getCoreContentText() {
  for (const [siteName, selectors] of Object.entries(adapters)) {
    if (location.hostname.includes(siteName)) {
      const element = getPossibleElementByQuerySelector(selectors)
      if (element) return element.innerText || element.textContent
      break
    }
  }

  const largestElement = findLargestElement(document.body)
  const secondLargestElement = findLargestElement(largestElement)
  console.log(largestElement)
  console.log(secondLargestElement)

  function getTextFrom(e) {
    return e.innerText || e.textContent
  }

  let ret
  if (!largestElement) {
    ret = getTextFrom(document.body)
    console.log('use document.body')
  } else if (
    secondLargestElement &&
    getArea(secondLargestElement) > 0.5 * getArea(largestElement)
  ) {
    ret = getTextFrom(secondLargestElement)
    console.log('use second')
  } else {
    ret = getTextFrom(largestElement)
    console.log('use first')
  }
  return ret.trim().replaceAll('  ', '').replaceAll('\n\n', '').replaceAll(',,', '')
}
