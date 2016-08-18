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
})

schema.virtual('cards')
  .get(function() {
    return Card.find({ _id: { $in: this.cardIds } }).exec()
  })
