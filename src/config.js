import convict from 'convict'

const conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  key: {
    doc: 'Trello API key',
    format: val => {
      if (!/^[a-fA-F0-9]{32}$/.test(val)) {
        throw new Error('must be a 32 character hex key')
      }
    },
    default: null,
    env: 'API_KEY'
  },
  secret: {
    doc: 'Trello API OAuth secret',
    format: val => {
      if (!/^[a-fA-F0-9]{64}$/.test(val)) {
        throw new Error('must be a 64 character hex key')
      }
    },
    default: null,
    env: 'API_SECRET'
  },
  ip: {
    doc: 'The IP address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 4001,
    env: 'PORT'
  },
  dbUrl: {
    doc: 'The URI of the Backlog MongoDB.',
    format: 'url',
    default: 'localhost:27017',
    env: 'DB_URL'
  }
})

conf.validate()

export default conf
