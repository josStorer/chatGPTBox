import {
  CardHeading,
  CardList,
  EmojiSmile,
  Palette,
  QuestionCircle,
  Translate,
} from 'react-bootstrap-icons'
import { getPreferredLanguage } from '../../config.mjs'

export const config = {
  translate: {
    icon: <Translate />,
    label: 'Translate',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return (
        `Translate the following into ${preferredLanguage} and only show me the translated content.` +
        `If it is already in ${preferredLanguage},` +
        `translate it into English and only show me the translated content:\n"${selection}"`
      )
    },
  },
  summary: {
    icon: <CardHeading />,
    label: 'Summary',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Summarize the following as concisely as possible:\n"${selection}"`
    },
  },
  polish: {
    icon: <Palette />,
    label: 'Polish',
    genPrompt: async (selection) =>
      `Check the following content for possible diction and grammar problems,and polish it carefully:\n"${selection}"`,
  },
  sentiment: {
    icon: <EmojiSmile />,
    label: 'Sentiment Analysis',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Analyze the sentiments expressed in the following content and make a brief summary of the sentiments:\n"${selection}"`
    },
  },
  divide: {
    icon: <CardList />,
    label: 'Divide Paragraphs',
    genPrompt: async (selection) =>
      `Divide the following into paragraphs that are easy to read and understand:\n"${selection}"`,
  },
  ask: {
    icon: <QuestionCircle />,
    label: 'Ask',
    genPrompt: async (selection) => {
      const preferredLanguage = await getPreferredLanguage()
      return `Reply in ${preferredLanguage}.Analyze the following content and express your opinion,or give your answer:\n"${selection}"`
    },
  },
}
