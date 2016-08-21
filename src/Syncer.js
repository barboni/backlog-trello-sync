import mongoose, { Backlog, Sprint } from './models'
import { createCard, createLabel, getBoardIdForList, clearLabels, labelColors, clearCards } from './trello'

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
    return getBoardIdForList(token, secret, { listId }).then(boardId => {
      return Backlog.findOne({ _id: backlogId }).exec().then(backlog => {
        if (!backlog) {
          throw new Error('Backlog does not exist')
        }

        return Sprint.findOne({ backlogId, isActive: true }).then(sprint => {
          return sprint.addTrelloList(token, secret, listId)
        }).then(() => {
          return backlog.addTrelloBoard(token, secret, boardId)
        })
      })
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

  addCard(token, secret, listId, card, labelsMapping) {
    const { title, description, estimate, labelIds } = card
    const trelloLabelIds = labelIds.map(labelId => labelsMapping[labelId])

    return createCard(token, secret, {
      listId,
      name: `(${estimate || '?'}) ${title}`,
      description,
      labelIds: trelloLabelIds
    }).then(trelloCard => {
      return card.addTrelloCard(token, secret, trelloCard.id)
    })
  }

  exportSprintToList(token, secret, sprint, labelsMapping) {
    const { sync: { trello: { id: listId } } } = sprint

    return clearCards(token, secret, { listId })
      .then(() => sprint.cards)
      .then(cards => Promise.all(cards.map(card => {
        return this.addCard(token, secret, listId, card, labelsMapping)
      })))
  }

  exportLabels(token, secret, labels, boardId) {
    return clearLabels(token, secret, { boardId }).then(() => {
      return Promise.all(labels.map(label => {
        return createLabel(token, secret, {
          boardId,
          name: label.name || '',
          color: labelColors[label.color] || null
        })
      }))
    })
  }

  exportBacklog(backlog) {
    const { _id: backlogId, labels, sync: { trello: { token, secret, id: boardId } } } = backlog

    return this.exportLabels(token, secret, labels, boardId).then((trelloLabels) => {
      const labelsMapping = trelloLabels.reduce((mapping, trelloLabel, i) => {
        const label = labels[i]
        mapping[label._id] = trelloLabel.id
        return mapping
      }, {})

      return Sprint.find({ backlogId, 'sync.trello': { $exists: true } }).exec().then(sprints => {
        return Promise.all(sprints.map(sprint => {
          return this.exportSprintToList(token, secret, sprint, labelsMapping)
        }))
      })
    }).catch(e => {
      console.log(e.stack)
    })
  }
}
