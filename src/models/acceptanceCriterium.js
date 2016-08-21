import { Schema } from 'mongoose'

export const schema = new Schema({
  id: String,
  title: String,
  done: Boolean,
  sync: {
    trello: {
      id: String,
      checklistId: String
    }
  },
})
