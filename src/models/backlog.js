import { Schema } from 'mongoose'
import { schema as label } from './label'

export const schema = new Schema({
  _id: String,
  labels: [label],
  sync: {
    trello: {
      id: String,
      token: String,
      secret: String
    }
  }
})

schema.methods.addTrelloBoard = function(token, secret, boardId) {
  //TODO check if authorized
  this.sync = this.sync || {}
  this.sync.trello = {
    id: boardId,
    token, secret
  }
  return this.save()
}

schema.methods.removeTrelloBoard = function(token, secret) {
  //TODO check if authorized
  if (!this.sync || !this.sync.trello) {
    throw new Error('No Trello board synchronized')
  }
  this.sync.trello = undefined
  return this.save()
}

schema.methods.addTrelloLabel = function(token, secret, labelId, trelloLabelId) {
  //TODO check if authorized
  const label = this.labels.id(labelId)
  label.sync = label.sync || {}
  label.sync.trello = {
    id: trelloLabelId
  }
  return this.save()
}

schema.methods.removeTrelloLabel = function(token, secret, labelId) {
  //TODO check if authorized
  const label = this.labels.id(labelId)
  if (!label.sync || !label.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  label.sync.trello = undefined
  return this.save()
}

