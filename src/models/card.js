import { Schema } from 'mongoose'
import random from 'meteor-random'

export const schema = new Schema({
  _id: { type: String, default: () => random.id() },
  title: String,
  description: String,
  status: { type: String, default: 'not-ready' },
  acceptanceCriteria: { type: Array, default: [] },
  labelIds: { type: [String], default: [] },
  attachments: { type: [String], default: [] },
})
