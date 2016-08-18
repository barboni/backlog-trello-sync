import { Schema } from 'mongoose'
import { schema as label } from './Label'

export const schema = new Schema({
  _id: String,
  labels: [label],
  sync: {
    trello: {
      id: {
        type: String,
        required: true
      },
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
