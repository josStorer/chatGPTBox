import jwt from 'jsonwebtoken'

let jwtToken = null
let tokenExpiration = null // Declare tokenExpiration in the module scope

function generateToken(apiKey, timeoutSeconds) {
  const parts = apiKey.split('.')
  if (parts.length !== 2) {
    throw new Error('Invalid API key')
  }

  const ms = Date.now()
  const currentSeconds = Math.floor(ms / 1000)
  const [id, secret] = parts
  const payload = {
    api_key: id,
    exp: currentSeconds + timeoutSeconds,
    timestamp: currentSeconds,
  }

  jwtToken = jwt.sign(payload, secret, {
    header: {
      alg: 'HS256',
      typ: 'JWT',
      sign_type: 'SIGN',
    },
  })
  tokenExpiration = ms + timeoutSeconds * 1000
}

function shouldRegenerateToken() {
  const ms = Date.now()
  return !jwtToken || ms >= tokenExpiration
}

function getToken(apiKey) {
  if (shouldRegenerateToken()) {
    generateToken(apiKey, 86400) // Hard-coded to regenerate the token every 24 hours
  }
  return jwtToken
}

export { getToken }
