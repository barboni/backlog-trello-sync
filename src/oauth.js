import { OAuth } from 'oauth'
import conf from './config.js'
import url from 'url'

const appName = 'Backlog sync'

const requestURL = "https://trello.com/1/OAuthGetRequestToken"
const accessURL = "https://trello.com/1/OAuthGetAccessToken"
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken"

const ip = conf.get('ip')
const port = conf.get('port')

const loginCallback = `http://${ip}:${port}/cb`

const key = conf.get('key')
const secret = conf.get('secret')

const oauth = new OAuth(requestURL, accessURL, key, secret, '1.0', loginCallback, 'HMAC-SHA1')

const oauthSecrets = {}

export const login = (req, res) => {
  oauth.getOAuthRequestToken((error, token, tokenSecret) => {
    oauthSecrets[token] = tokenSecret
    res.writeHead(302, { 'Location': `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=read,write` })
    res.end()
  })
}

export const cb = (req, res) => {
  const query = url.parse(req.url, true).query

  const token = query.oauth_token
  const tokenSecret = oauthSecrets[token]
  const verifier = query.oauth_verifier

  oauth.getOAuthAccessToken(token, tokenSecret, verifier, (error, accessToken, accessTokenSecret) => {
    res.json({
      accessToken,
      accessTokenSecret
    })
  })
}

export default oauth
