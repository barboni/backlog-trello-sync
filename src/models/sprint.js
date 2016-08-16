import { Schema } from 'mongoose'
import random from 'meteor-random'

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
