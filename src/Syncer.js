import mongoose, { Backlog, Sprint } from './models'
import Promise from 'bluebird'
import {
  getBoardIdForList,
  createCard, createLabel, createChecklist, createChecklistItem, createWebhook,
  clearLabels, clearCards,
  labelColors,
} from './trello'

export default class Syncer {
  constructor(dbUrl, callbackURL) {
    this.dbUrl = dbUrl
    this.callbackURL = callbackURL
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
    const { _id, title, description, estimate, labelIds } = card
    const trelloLabelIds = labelIds.map(labelId => labelsMapping[labelId])

    return createCard(token, secret, {
        listId,
        name: `(${estimate || '?'}) ${title}`,
        description,
        labelIds: trelloLabelIds
      })
      .then(trelloCard => {
        const modelId = trelloCard.id
        const description = 'Card'
        return createWebhook(token, secret, {
          modelId, description,
          callbackURL: `${this.callbackURL}/card?id=${_id}`
        }).then(() => trelloCard)
      })
      .then(trelloCard => {
        return card.addTrelloCard(token, secret, trelloCard.id)
      })
      .then(newCard => {
        this.exportAcceptanceCriteria(token, secret, newCard)
        return newCard
      })
  }

  exportSprintToList(token, secret, sprint, labelsMapping) {
    const { sync: { trello: { id: listId } } } = sprint

    return clearCards(token, secret, { listId })
      .then(() => sprint.cards)
      .then(cards => {
        return Promise.mapSeries(cards, card => {
          return this.addCard(token, secret, listId, card, labelsMapping)
        })
      })
  }

  addLabel(token, secret, boardId, backlog, label) {
    return createLabel(token, secret, {
      boardId,
      name: label.name || '',
      color: labelColors[label.color] || null
    }).then(trelloLabel => {
      return backlog.addTrelloLabel(token, secret, label._id, trelloLabel.id)
    })
  }

  addAcceptanceCriterium(token, secret, checklistId, ac, card) {
    return createChecklistItem(token, secret, {
      checklistId: checklistId,
      name: ac.title,
      checked: ac.done
    }).then(checklistItem => {
      return card.addTrelloChecklistItem(token, secret, ac.id, checklistItem.id, checklistId)
    })
  }

  exportAcceptanceCriteria(token, secret, card) {
    const { sync: { trello: { id: cardId } }, acceptanceCriteria } = card
    return createChecklist(token, secret, { cardId, name: 'Acceptance criteria' })
      .then(checklist => {
        return Promise.mapSeries(acceptanceCriteria, acceptanceCriterium => {
          return this.addAcceptanceCriterium(token, secret, checklist.id, acceptanceCriterium, card)
        })
      })
  }

  exportLabels(token, secret, backlog, boardId) {
    const { labels } = backlog

    return clearLabels(token, secret, { boardId })
      .then(() => {
        return Promise.mapSeries(labels, this.addLabel.bind(this, token, secret, boardId, backlog))
      })
      .then(() => {
        return Backlog.findById(backlog._id).exec()
          .then(backlogWithLabels => backlogWithLabels.labels.reduce((mapping, label) => {
            const { _id, sync: { trello: { id } } } = label
            mapping[_id] = id
            return mapping
          }, {}))
      })
  }

  exportBacklog(backlog) {
    const { _id: backlogId, sync: { trello: { token, secret, id: boardId } } } = backlog

    return this.exportLabels(token, secret, backlog, boardId).then(labelsMapping => {
      return Sprint.find({ backlogId, 'sync.trello': { $exists: true } }).exec().then(sprints => {
        return Promise.mapSeries(sprints, sprint => {
          return this.exportSprintToList(token, secret, sprint, labelsMapping)
        })
      })
    }).catch(e => {
      console.log(e.stack)
    })
  }
}
