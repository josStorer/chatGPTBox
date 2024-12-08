# Changes

this is a patch for v2.5.7, including some minor fixes and improvements

## Features
- unlimited custom API Modes (#731, #717, #712, #659, #647)

<img src="https://github.com/user-attachments/assets/6419a024-b8e2-48c4-8b64-fc4fe705ce36" width="256"/>

<img src="https://github.com/user-attachments/assets/f7602e33-7772-41d3-81a6-ccb1dccaf00f" width="256"/>

- Option to always display floating window, disable sidebar for all site adapters (#747, #753) f50249e7 226fb108 b96ba7c0

![image](https://github.com/user-attachments/assets/6975496b-3700-4de5-ae31-6d35ce6e9e80)

- Add Ollama native API to support keep alive parameters (#748) 6877a1b7 48817006

<img src="https://github.com/user-attachments/assets/f9647f03-da17-447b-988a-ec3b1db66fe6" width="256"/>

- Option to allow ESC to close all floating windows (#750)
- allow exporting and importing all data (#740)

<img src="https://github.com/user-attachments/assets/f26ff58e-5371-47fd-bf20-1c9afa0cfb63" width="256"/>

## Improvements
- for simplified chinese users, use Kimi.Moonshot Web for free by default, while other users default to using Claude.ai for free and a better user experience
- improve chatglm support (#696, #464)
- improve style conflicts (#724, #378)
- improve user experience for claude.ai and kimi.moonshot.cn

## Fixes
- fix firefox bilibili summary (#761)
- fix Buffer is not defined when using tiny package (#691, https://github.com/josStorer/chatGPTBox/issues/752#issuecomment-2240977750)

## Chores
- Added Claude 3.5 Sonnet API to available models e7cec334
- Add gpt-4o-mini for both web and api access (#749)
- update enforcement rule
