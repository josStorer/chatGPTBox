import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'

export function Hyperlink({ href, children }) {
  const linkProperties = {
    target: '_blank',
    style: 'color: #8ab4f8; cursor: pointer;',
    rel: 'nofollow noopener noreferrer',
  }

  return href.includes('chatgpt.com') ? (
    <span
      {...linkProperties}
      onClick={() => {
        Browser.runtime.sendMessage({
          type: 'NEW_URL',
          data: {
            url: href,
            pinned: false,
            saveAsChatgptConfig: true,
          },
        })
      }}
    >
      {children}
    </span>
  ) : (
    <a href={href} {...linkProperties}>
      {children}
    </a>
  )
}

Hyperlink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
}
