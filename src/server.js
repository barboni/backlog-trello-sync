import express from 'express'
import conf from './config.js'
import bodyParser from 'body-parser'
import cors from 'cors'
import { login, cb } from './oauth.js'
import { getUserBoards, createBoard, createList, getLists } from './trello.js'
import Syncer from './Syncer'

const app = express()

const port = conf.get('port')
const dbUrl = conf.get('dbUrl')
const callbackURL = conf.get('callbackUrl')

const syncer = new Syncer(dbUrl, callbackURL)
syncer.start()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: 'http://localhost:8080' }))
}

app.get('/login', login)
app.get('/cb', cb)

app.post('/list-boards', (req, res) => {
  const { body: { token, secret } } = req
  getUserBoards(token, secret)
    .then(boards => boards.map(b => ({ id: b.id, name: b.name })))
    .then(boards => res.json(boards))
})

app.post('/list-lists', (req, res) => {
  const { body: { token, secret, boardId } } = req
  getLists(token, secret, { boardId })
    .then(result => res.json(result))
})

app.post('/create-board', (req, res) => {
  const { body: { token, secret, name } } = req
  createBoard(token, secret, { name })
    .then(result => res.json(result))
})

app.post('/create-list', (req, res) => {
  const { body: { token, secret, name, boardId } } = req
  createList(token, secret, { name, boardId })
    .then(result => res.json(result))
})

app.post('/synchronize', (req, res) => {
  const { body: { token, secret, backlogId } } = req
  return syncer.exportActiveSprintFromBacklog(token, secret, backlogId)
    .then(result => res.json(result))
})

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})


