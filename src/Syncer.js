import mongoose, { Backlog, Sprint } from './models'
import { createCard, createLabel, getBoardIdForList } from './trello'

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

  exportSprintToList(token, secret, sprintId, listId) {
    return Sprint.findOne({ _id: sprintId }).exec().then(sprint => {
      if (!sprint) {
        throw new Error('Given sprint does not exist')
      }

      return sprint.cards.then(cards => cards.map((card) => {
        const { title, description, estimate } = card
        return createCard(token, secret, {
          listId,
          name: `[${estimate}] ${title}`,
          description
        })
      }))
    })
  }

  exportLabels(token, secret, labels, boardId) {
    return labels.map(label => {
      return createLabel(token, secret, {
        boardId,
        name: label.name || '',
        color: label.color || null
      })
    })
  }

  exportActiveSprintFromBacklog(backlog) {
    const { _id: backlogId, labels, sync: { trello: { token, secret, id: listId } } } = backlog

    return getBoardIdForList(token, secret, listId)
      .then(boardId => {
        this.exportLabels(token, secret, labels, boardId)
      })
      .then(() => {
        return Sprint.findOne({ backlogId, isActive: true }).then(sprint => {
          return this.exportSprintToList(token, secret, sprint._id, listId)
        })
      })
  }
}
