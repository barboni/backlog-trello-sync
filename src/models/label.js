import { Schema } from 'mongoose'

export const schema = new Schema({
  _id: String,
  name: String,
  color: String,
  sync: {
    trello: {
      id: String
    }
  },
})
