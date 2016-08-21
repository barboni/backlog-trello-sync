import { Schema } from 'mongoose'
import { schema as acceptanceCriterium } from './acceptanceCriterium'
import random from 'meteor-random'

export const schema = new Schema({
  _id: { type: String, default: () => random.id() },
  title: String,
  description: String,
  status: { type: String, default: 'not-ready' },
  acceptanceCriteria: { type: [acceptanceCriterium], default: [] },
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

schema.methods.addTrelloChecklistItem = function(token, secret, acId, itemId, checklistId) {
  //TODO check if authorized
  const ac = this.acceptanceCriteria.find(ac => ac.id === acId)
  ac.sync = ac.sync || {}
  ac.sync.trello = {
    id: itemId,
    checklistId
  }
  return this.save()
}

schema.methods.removeTrelloChecklistItem = function(token, secret, acId) {
  //TODO check if authorized
  const ac = this.acceptanceCriteria.id(acId)
  if (!ac.sync || !ac.sync.trello) {
    throw new Error('No Trello list synchronized')
  }
  ac.sync.trello = undefined
  return this.save()
}
