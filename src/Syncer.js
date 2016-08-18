import mongoose, { Backlog, Sprint, Card } from './models'
import { createCard } from './trello'

export default class Syncer {
  constructor(dbUrl) {
    this.dbUrl = dbUrl
    this.db = null
    this.running = false
  }

  start() {
    mongoose.connect(this.dbUrl)
    this.db = mongoose.connection
    this.db.on('error', console.error.bind(console, 'connection error:'))
    this.db.once('open', () => {
      this.running = true
      console.log('running')
    })
  }

  stop() {
    mongoose.disconnect().then(() => {
      this.running = false
    })
  }

  addBacklog(token, secret, backlogId, listId) {
    return Backlog.findOne({ _id: backlogId }).exec().then(backlog => {
      if (!backlog) {
        throw new Error('Backlog does not exist')
      }

      return backlog.addTrelloBoard(token, secret, listId)
    })
  }

  removeBacklog(token, secret, backlogId) {
    return Backlog.findOne({ _id: backlogId }).exec().then(backlog => {
      if (!backlog) {
        throw new Error('Backlog does not exist')
      }

      return backlog.removeTrelloBoard(token, secret)
    })
  }

  exportBacklog(backlog) {
    const { _id: backlogId, labels, sync: { trello: { token, secret, id: listId } } } = backlog

    return Sprint.findOne({ backlogId, isActive: true }).exec().then(sprint => {
      if (!sprint) {
        throw new Error('No active sprint')
      }

      return sprint.cards.then(cards => cards.map((card) => {
        const { title, description } = card
        return createCard(token, secret, {
          listId,
          name: title,
          description
        })
      }))
    })
  }
}
