import { Schema } from 'mongoose'

export const schema = new Schema({
  _id: false,
  id: String,
  title: String,
  done: Boolean,
  sync: {
    trello: {
      id: String,
      checklistId: String
    }
  },
})

schema.methods.addTrelloChecklistItem = function(token, secret, itemId, checklistId) {
  //TODO check if authorized
  this.sync = this.sync || {}
  this.sync.trello = {
    id: itemId,
    checklistId
  }
  return this.save()
}

schema.methods.removeTrelloChecklistItem = function(token, secret) {
  //TODO check if authorized
  if (!this.sync || !this.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  this.sync.trello = undefined
  return this.save()
}
