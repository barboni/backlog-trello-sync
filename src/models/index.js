import mongoose from 'mongoose'

import { schema as backlogSchema } from './backlog'
import { schema as sprintSchema } from './sprint'
import { schema as cardSchema } from './card'

mongoose.Promise = global.Promise

export const Backlog = mongoose.model('Backlog', backlogSchema)
export const Sprint = mongoose.model('Sprint', sprintSchema)
export const Card = mongoose.model('Card', cardSchema)

export default mongoose
