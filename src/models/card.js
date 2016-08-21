import { Schema } from 'mongoose'
import random from 'meteor-random'

export const schema = new Schema({
  _id: { type: String, default: () => random.id() },
  title: String,
  description: String,
  status: { type: String, default: 'not-ready' },
  acceptanceCriteria: { type: Array, default: [] },
  labelIds: { type: [String], default: [] },
  attachments: { type: [String], default: [] },
  sync: {
    trello: {
      id: String
    }
  },
})

schema.methods.addTrelloCard = function(token, secret, cardId) {
  //TODO check if authorized
  this.sync = this.sync || {}
  this.sync.trello = {
    id: cardId
  }
  return this.save()
}

schema.methods.removeTrelloCard = function(token, secret) {
  //TODO check if authorized
  if (!this.sync || !this.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  this.sync.trello = undefined
  return this.save()
}
