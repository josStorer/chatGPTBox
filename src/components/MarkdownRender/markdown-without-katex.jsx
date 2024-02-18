import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Pre } from './Pre'
import { Hyperlink } from './Hyperlink'
import { memo } from 'react'

export function MarkdownRender(props) {
  return (
    <div dir="auto">
      <ReactMarkdown
        allowedElements={[
          'div',
          'p',
          'span',

          'video',
          'img',

          'abbr',
          'acronym',
          'b',
          'blockquote',
          'code',
          'em',
          'i',
          'li',
          'ol',
          'ul',
          'strong',
          'table',
          'tr',
          'td',
          'th',

          'details',
          'summary',
          'kbd',
          'samp',
          'sub',
          'sup',
          'ins',
          'del',
          'var',
          'q',
          'dl',
          'dt',
          'dd',
          'ruby',
          'rt',
          'rp',

          'br',
          'hr',

          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',

          'thead',
          'tbody',
          'tfoot',
          'u',
          's',
          'a',
          'pre',
          'cite',
        ]}
        unwrapDisallowed={true}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
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
