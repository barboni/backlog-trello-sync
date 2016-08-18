import express from 'express'
import conf from './config.js'
import bodyParser from 'body-parser'
import { login, cb } from './oauth.js'
import { getUserBoards, createBoard, createList, getLists } from './trello.js'

const app = express()

const port = conf.get('port')

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

if (conf.get('env') === 'development') {
  app.get('/login', login)
  app.get('/cb', cb)
}

app.post('/list-boards', (req, res) => {
  const { body: { token, secret } } = req
  getUserBoards(token, secret)
    .then(boards => boards.map(b => b.name))
    .then(names => res.json(names))
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

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})


