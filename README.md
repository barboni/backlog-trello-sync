## UNDER DEVELOPMENT AND HIGHLY UNSTABLE

# Backlog Trello sync

Synchronize your [backlogapp](www.backlogapp.io) with trello.

## Running

First ensure that the configuration is right for your needs. You can override all values by setting the corresponding ENV variables. All following values in `config.js` need to be set:
```js
{
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
}
```

`key` and `secret` have no default values on purpose. Please use your own. You can get both [here](https://trello.com/app-key).
If you agree with all settings, start the server with:
```
API_KEY="<trello-api-key>" API_SECRET="<trello-api-secret>" npm start
```

## Developing

If you want to automatically have the server restarted while developing, you would want to let nodemon watch your changes.
You can do this by running:

```sh
DB_ULR="<url-to-backlog-db>" npm run dev
```
You can find the Backlog DB URL by running `meteor mongo`.

## Endpoints

⚠ Important ⚠

Each request needs to be a POST request and have the keys `token` and `secret` in the payload. This are the token and secret you get once you authorized this microservice against the Trello OAuth mechanism. While running this server in development mode, you can do this by going to [http://localhost:4001/login](http://localhost:4001/login).

### List Trello boards

Endpoint: `/list-boards`

Required:
- `token`
- `secret`

### Create a Trello board

Endpoint: `/create-board`

Required:
- `token`
- `secret`
- `name`: the name of the board

### Create a Trello list

Endpoint: `/create-list`

Required:
- `token`
- `secret`
- `name`: the name of the list
- `boardId`: the id of the board to create the list in
