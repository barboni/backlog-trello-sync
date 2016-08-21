import { Schema } from 'mongoose'

export const schema = new Schema({
  _id: String,
  name: String,
  color: String,
  sync: {
    trello: {
      id: String
    }
  },
})

schema.methods.addTrelloLabel = function(token, secret, labelId) {
  //TODO check if authorized
  this.sync = this.sync || {}
  this.sync.trello = {
    id: labelId
  }
  return this.save()
}

schema.methods.removeTrelloLabel = function(token, secret) {
  //TODO check if authorized
  if (!this.sync || !this.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  this.sync.trello = undefined
  return this.save()
}
