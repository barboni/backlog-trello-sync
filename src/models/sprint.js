import { Schema } from 'mongoose'
import random from 'meteor-random'
import { Card } from './'

export const schema = new Schema({
  _id: { type: String, default: () => random.id() },
  startDate: Date,
  duration: Number,
  cardIds: [String],
  isActive: { type: Boolean, default: false },
  isClosed: { type: Boolean, default: false },
  isInPlanning: { type: Boolean, default: false },
  isTail: { type: Boolean, default: false },
  backlogId: String,
  sync: {
    trello: {
      id: String
    }
  },
})

schema.virtual('cards')
  .get(function() {
    return Card.find({ _id: { $in: this.cardIds } }).exec()
  })

schema.methods.addTrelloList = function(token, secret, listId) {
  //TODO check if authorized
  this.sync = this.sync || {}
  this.sync.trello = {
    id: listId
  }
  return this.save()
}

schema.methods.removeTrelloList = function(token, secret) {
  //TODO check if authorized
  if (!this.sync || !this.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  this.sync.trello = undefined
  return this.save()
}
