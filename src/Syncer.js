import { mongoose } from 'backlog-models'
import models from './models'
import Promise from 'bluebird'
import {
  getBoardIdForList,
  createCard, createLabel, createChecklist, createChecklistItem, createWebhook,
  clearLabels, clearCards,
  labelColors,
} from './trello'

const { Backlog, Sprint, Card } = models

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

  exportSprintToList(token, secret, sprint, listId, labelsMapping) {
    return clearCards(token, secret, { listId })
      .then(() => {
        return Card.find({ _id: { $in: sprint.cardIds } }).exec().then(cards => cards.sort((a, b) => {
          return sprint.cardIds.indexOf(a._id) - sprint.cardIds.indexOf(b._id)
        }))
      })
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
    if (acceptanceCriteria.length > 0) {
      return createChecklist(token, secret, { cardId, name: 'Acceptance criteria' })
        .then(checklist => {
          return Promise.mapSeries(acceptanceCriteria, acceptanceCriterium => {
            return this.addAcceptanceCriterium(token, secret, checklist.id, acceptanceCriterium, card)
          })
        })
    }
    return Promise.resolve({})
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

  exportActiveSprintFromBacklog(token, secret, backlogId) {
    return Backlog.findOne({ _id: backlogId }).exec().then(backlog => {
      const { sync: { trello: { accessToken, accessTokenSecret, listId } } } = backlog

      if (accessToken !== token || accessTokenSecret !== secret) {
        throw new Error('not authorized')
      }

      return getBoardIdForList(token, secret, { listId }).then(boardId => {
        return this.exportLabels(token, secret, backlog, boardId).then(labelsMapping => {
          return Sprint.findOne({ backlogId, isActive: true }).exec().then(sprint => {
            return this.exportSprintToList(token, secret, sprint, listId, labelsMapping)
          })
        })
      })
    })
  }
}
