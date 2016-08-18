import mongoose, { Backlog, Sprint, Card } from './models'

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

  addBacklog(token, secret, backlogId, boardId) {
    return Backlog.findOne(backlogId).exec().then(backlog => {
      if (!backlog) {
        throw new Error('Backlog does not exist')
      }

      return backlog.addTrelloBoard(token, secret, boardId)
    })
  }

  removeBacklog(token, secret, backlogId) {
    return Backlog.findOne(backlogId).exec().then(backlog => {
      if (!backlog) {
        throw new Error('Backlog does not exist')
      }

      return backlog.removeTrelloBoard(token, secret)
    })
  }
}
