import {
  CardHeading,
  CardList,
  EmojiSmile,
  Palette,
  QuestionCircle,
  Translate,
  Braces,
  Globe,
  ChatText,
} from 'react-bootstrap-icons'
import { getPreferredLanguage } from '../../config/language.mjs'

const createGenPrompt =
  (message, isTranslation = false, targetLanguage = '', enableBidirectional = false) =>
    async (selection) => {
      const preferredLanguage = isTranslation
        ? targetLanguage
        : await getPreferredLanguage()
      let fullMessage = isTranslation
        ? `Translate the following into ${preferredLanguage} and only show me the translated content`
        : message;
      if (enableBidirectional) {
        fullMessage += `. If it is already in ${preferredLanguage}, translate it into English and only show me the translated content`
      }
      return `Reply in ${preferredLanguage}.${fullMessage}:\n'''\n${selection}\n'''`
    }

export const config = {
  explain: {
    icon: <ChatText />,
    label: 'Explain',
    genPrompt: createGenPrompt('Explain the following'),
  },
  translate: {
    icon: <Translate />,
    label: 'Translate',
    genPrompt: createGenPrompt('', true),
  },
  translateToEn: {
    icon: <Globe />,
    label: 'Translate (To English)',
    genPrompt: createGenPrompt('', true, 'English'),
  },
  translateToZh: {
    icon: <Globe />,
    label: 'Translate (To Chinese)',
    genPrompt: createGenPrompt('', true, 'Chinese'),
  },
  translateBidi: {
    icon: <Globe />,
    label: 'Translate (Bidirectional)',
    genPrompt: createGenPrompt('', true, '', true),
  },
  summary: {
    icon: <CardHeading />,
    label: 'Summary',
    genPrompt: createGenPrompt(
      'Summarize the following as concisely as possible'
    ),
  },
  polish: {
    icon: <Palette />,
    label: 'Polish',
    genPrompt: createGenPrompt(
      'Check the following content for possible diction and grammar problems, and polish it carefully',
      false
    ),
  },
  sentiment: {
    icon: <EmojiSmile />,
    label: 'Sentiment Analysis',
    genPrompt: createGenPrompt(
      'Analyze the sentiments expressed in the following content and make a brief summary of the sentiments'
    ),
  },
  divide: {
    icon: <CardList />,
    label: 'Divide Paragraphs',
    genPrompt: createGenPrompt(
      'Divide the following into paragraphs that are easy to read and understand',
      false
    ),
  },
  code: {
    icon: <Braces />,
    label: 'Code Explain',
    genPrompt: createGenPrompt('Explain the following code'),
  },
  ask: {
    icon: <QuestionCircle />,
    label: 'Ask',
    genPrompt: createGenPrompt(
      'Analyze the following content and express your opinion, or give your answer'
    ),
  },
}