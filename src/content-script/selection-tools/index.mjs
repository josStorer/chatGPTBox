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

export const config = {
  explain: {
    icon: <ChatText />,
    label: 'Explain',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Explain the following:\n"""\n${selection}\n"""`
    },
  },
  translate: {
    icon: <Translate />,
    label: 'Translate',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Translate the following into ${preferredLanguage} and only show me the translated content:\n"""\n${selection}\n"""`
    },
  },
  translateToEn: {
    icon: <Globe />,
    label: 'Translate (To English)',
    genPrompt: async (selection) => {
      return `Translate the following into English and only show me the translated content:\n"""\n${selection}\n"""`
    },
  },
  translateToZh: {
    icon: <Globe />,
    label: 'Translate (To Chinese)',
    genPrompt: async (selection) => {
      return `Translate the following into Chinese and only show me the translated content:\n"""\n${selection}\n"""`
    },
  },
  translateBidi: {
    icon: <Globe />,
    label: 'Translate (Bidirectional)',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return (
        `Translate the following into ${preferredLanguage} and only show me the translated content.` +
        `If it is already in ${preferredLanguage},` +
        `translate it into English and only show me the translated content:\n"""\n${selection}\n"""`
      )
    },
  },
  summary: {
    icon: <CardHeading />,
    label: 'Summary',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Summarize the following as concisely as possible:\n"""\n${selection}\n"""`
    },
  },
  polish: {
    icon: <Palette />,
    label: 'Polish',
    genPrompt: async (selection) =>
      `Check the following content for possible diction and grammar problems,and polish it carefully:\n"""\n${selection}\n"""`,
  },
  sentiment: {
    icon: <EmojiSmile />,
    label: 'Sentiment Analysis',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Analyze the sentiments expressed in the following content and make a brief summary of the sentiments:\n"""\n${selection}\n"""`
    },
  },
  divide: {
    icon: <CardList />,
    label: 'Divide Paragraphs',
    genPrompt: async (selection) =>
      `Divide the following into paragraphs that are easy to read and understand:\n"""\n${selection}\n"""`,
  },
  code: {
    icon: <Braces />,
    label: 'Code Explain',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Explain the following code:\n"""\n${selection}\n"""`
    },
  },
  ask: {
    icon: <QuestionCircle />,
    label: 'Ask',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Analyze the following content and express your opinion,or give your answer:\n"""\n${selection}\n"""`
    },
  },
}
