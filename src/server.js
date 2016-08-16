import express from 'express'
import conf from './config.js'
import bodyParser from 'body-parser'
import { login, cb } from './oauth.js'

const app = express()

const port = conf.get('port')

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

if (conf.get('env') === 'development') {
  app.get('/login', login)
  app.get('/cb', cb)
}

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})


