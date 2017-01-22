import express from 'express'
import conf from './config.js'
import bodyParser from 'body-parser'
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
  const { body: { token, secret, backlogId, listId } } = req
  syncer.addBacklog(token, secret, backlogId, listId)
    .then(backlog => {
      return syncer.exportBacklog(backlog)
    })
    .then(result => res.json(result))
})

app.put('/synchronize', (req, res) => {
  const { body: { token, secret, backlogId, listId } } = req
  let promise

  if (!listId) {
    promise = syncer.removeBacklog(token, secret, backlogId)
  } else {
    promise = syncer.addBacklog(token, secret, backlogId, listId)
  }

  promise.then(result => res.json(result))
})

app.head('/webhooks/:type', (req, res) => {
  if (!['backlog', 'sprint', 'card'].includes(req.params.type)) {
    return res.status(403).send()
  }

  res.status(200).send()
})

app.post('/webhooks/:type', (req, res) => {
  const { body: { action: { type: actionType, data } }, params: { type }, query: { id } } = req

  if (!['board', 'list', 'card'].includes(type)) {
    return res.status(403).send()
  }

  if (actionType === 'updateCard') {
    const changedField = Object.keys(data.old)[0]
    let newValue = data.card[changedField]
    const fieldsMapping = {
      desc: 'description',
      name: 'title',
    }
    const mappedField = fieldsMapping[changedField]
    const estimates = newValue.match(/^\((1|2|3|5|8|13|\?)\)/)

    if (mappedField === 'title' && estimates && estimates.length > 1) {
      let estimate = estimates[1]
      if (estimate === '?') {
        estimate = null
      }
      syncer.updateBacklogCard(id, 'estimate', estimate)
      newValue = newValue.substring(estimates[0].length + 1)
    }

    if (mappedField) {
      return syncer.updateBacklogCard(id, mappedField, newValue).then(
        res.status(200).send()
      )
    }
  }

  res.status(200).send()
})

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})


