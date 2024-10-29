// MIT License
//
// Copyright (c) 2023 josStorer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { encode } from '@nem035/gpt-3-encoder'
import { getUserConfig } from '../config/index.mjs'
import { apiModeToModelName, modelNameToDesc } from './model-name-convert.mjs'

const clamp = (v, min, max) => {
  return Math.min(Math.max(v, min), max)
}

/** this function will crop text by keeping the beginning and end */
export async function cropText(
  text,
  maxLength = 4000,
  startLength = 400,
  endLength = 300,
  tiktoken = true,
) {
  const userConfig = await getUserConfig()
  const k = modelNameToDesc(
    userConfig.apiMode ? apiModeToModelName(userConfig.apiMode) : userConfig.modelName,
    null,
    userConfig.customModelName,
  ).match(/[- (]*([0-9]+)k/)?.[1]
  if (k) {
    maxLength = Number(k) * 1000
    maxLength -= 100 + clamp(userConfig.maxResponseTokenLength, 1, maxLength - 1000)
  } else {
    maxLength -= 100 + clamp(userConfig.maxResponseTokenLength, 1, maxLength - 1000)
  }

  const splits = text.split(/[,，。?？!！;；\n]/).map((s) => s.trim())
  const splitsLength = splits.map((s) => (tiktoken ? encode(s).length : s.length))
  const cropTargetLength = maxLength - startLength - endLength

  let firstHalfTokens = 0
  let secondHalfTokens = 0
  const halfTargetTokens = Math.floor(cropTargetLength / 2)
  let middleIndex = -1
  let endStartIndex = splits.length
  let totalTokens = splitsLength.reduce((sum, length) => sum + length + 1, 0)
  let croppedTokens = 0
  let croppedText = ''
  let currentLength = 0

  // First pass: find the middle
  for (let i = 0; i < splits.length; i++) {
    if (firstHalfTokens < halfTargetTokens) {
      firstHalfTokens += splitsLength[i] + 1
    } else {
      middleIndex = i
      break
    }
  }

  // Second pass: find the start of the end section
  for (let i = splits.length - 1; i >= middleIndex; i--) {
    secondHalfTokens += splitsLength[i] + 1
    if (secondHalfTokens >= halfTargetTokens) {
      endStartIndex = i
      break
    }
  }

  // Calculate cropped tokens
  croppedTokens = totalTokens - firstHalfTokens - secondHalfTokens

  // Construct the cropped text
  croppedText = splits.slice(0, middleIndex).join('\n')
  if (middleIndex !== endStartIndex) {
    croppedText += `\n\n**Important disclaimer**, this text is incomplete! ${croppedTokens} or ${
      (croppedTokens / totalTokens).toFixed(2) * 100
    }% of tokens have been removed from this location in the text due to lack limited model context\n\n`
  }
  croppedText += splits.slice(endStartIndex).join('\n')

  currentLength = firstHalfTokens + secondHalfTokens + (middleIndex !== endStartIndex ? 9 : 0) // 9 is the length of "\n[cropped]\n"
  // ... existing code ...

  console.log(
    `input maxLength: ${maxLength}\n` +
      `maxResponseTokenLength: ${userConfig.maxResponseTokenLength}\n` +
      // `croppedTextLength: ${tiktoken ? encode(croppedText).length : croppedText.length}\n` +
      `desiredLength: ${currentLength}\n` +
      `content: ${croppedText}`,
  )
  return croppedText
}
