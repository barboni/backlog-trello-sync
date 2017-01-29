import { OAuth } from 'oauth'
import conf from './config.js'
import url from 'url'

const appName = 'Backlog'

const requestUrl = 'https://trello.com/1/OAuthGetRequestToken'
const authorizeUrl = 'https://trello.com/1/OAuthAuthorizeToken'
const accessUrl = 'https://trello.com/1/OAuthGetAccessToken'

const loginCallback = conf.get('authCallbackUrl')

const devKey = conf.get('key')
const devSecret = conf.get('secret')

const oauth = new OAuth(requestUrl, accessUrl, devKey, devSecret, '1.0', loginCallback, 'HMAC-SHA1')

const oauthSecrets = {}

export const login = (req, res) => {
  const query = url.parse(req.url, true).query

  const returnUrl = query.return_url

  oauth.getOAuthRequestToken((error, requestToken, requestTokenSecret) => {
    const scope = 'read,write'
    const expiration = 'never'
    const locationUrl = `${authorizeUrl}?oauth_token=${requestToken}&name=${appName}&scope=${scope}&expiration=${expiration}`

    if (error) {
      return handleError(res, error)
    }

    oauthSecrets[requestToken] = {
      requestTokenSecret,
      returnUrl
    }

    res.writeHead(302, { 'Location': locationUrl })
    res.end()
  })
}

export const cb = (req, res) => {
  const query = url.parse(req.url, true).query

  const requestToken = query.oauth_token
  const { requestTokenSecret, returnUrl } = oauthSecrets[requestToken]
  const verifier = query.oauth_verifier

  oauth.getOAuthAccessToken(requestToken, requestTokenSecret, verifier, (error, accessToken, accessTokenSecret) => {
    if (error) {
      return handleError(res, error)
    }

    res.writeHead(302, { 'Location': `${returnUrl}?accessToken=${accessToken}&accessTokenSecret=${accessTokenSecret}` })
    res.end()
  })
}

function handleError(res, error) {
  res.status(500)
  res.render('error', { error })
}

export default oauth
