# Changes of v2.5.2

## Fixes

- fix the error caused by the unnecessary ArkoseToken for free accounts (#661)
- upgrade component mount for brave search

# Changes of v2.5.1

## Upgrades
- 074b6cc: upgrade chatgpt web (new arkoseToken and requirementsToken) (#653, #658, #661) (josc146)
- c4a537f: switch azure openai api version to stable version (#640) (josc146)
- a6fa0ed: Update Google Gemini integration (Tomasz Panasiuk) [#649](https://github.com/josStorer/chatGPTBox/pull/649)

## Features
- 21b8468: Add support for kimi.moonshot.cn Web mode (#656) (xxcdd) [#656](https://github.com/josStorer/chatGPTBox/pull/656)
- 381cea3: allow hiding context menu (#643) (josc146)
- e2ec8ac: claude 3 api support (#642) (josc146)
- 74bcba8: allow custom claude api url (#644) (josc146)

## Improvements
- 9cbe4f3: improve websocket support for chatgpt web mode (#652) (josc146)
- 680900b: add additional finish conditions for OpenAI API and Custom API (both can be customized, thus requiring more condition checks, now the api has better support for [ollama](https://github.com/ollama/ollama) and LM Studio) (#631, #648) (josc146)
- eb88fc2: getCoreContentText for any websites using mozilla/readability (#641) (xxcdd) [#641](https://github.com/josStorer/chatGPTBox/pull/641)
- c00b8ff: improve moonshot api support (#623) (josc146)
- d49280c: improve delta process (#657) (josc146)
- cbeae3e: bigger FloatingToolbar icon (josc146)
- 26d6ca5: dark mode for SelectionToolbar (#651) (josc146)

## Fixes
- db35e05: fix #538 breaks archwiki enumeration (katex css on body) (josc146)
- d53d8b8: fix https://github.com/josStorer/chatGPT-search-engine-extension/issues/23 again (caused by dcd34156) (josc146) (#660)

## Chores
- 985adb9: reduce package size (josc146)
- 4226cf5: update enforcement rule (josc146)
- 1ec752c: update i18n (josc146)
- 68e3a8a: update readme (josc146)
