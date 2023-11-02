import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Pre } from './Pre'
import { Hyperlink } from './Hyperlink'
import { memo } from 'react'

export function MarkdownRender(props) {
  return (
    <div dir="auto">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeKatex,
          rehypeRaw,
          [
            rehypeHighlight,
            {
              detect: true,
              ignoreMissing: true,
            },
          ],
        ]}
        components={{
          a: Hyperlink,
          pre: Pre,
        }}
        {...props}
      >
        {props.children}
      </ReactMarkdown>
    </div>
  )
}

MarkdownRender.propTypes = {
  ...ReactMarkdown.propTypes,
}

export default memo(MarkdownRender)
