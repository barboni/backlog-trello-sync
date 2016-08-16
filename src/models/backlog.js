import { Schema } from 'mongoose'
import { schema as label } from './Label'

export const schema = new Schema({
  _id: String,
  labels: [label]
})
