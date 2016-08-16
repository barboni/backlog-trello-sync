import oauth from './oauth.js'

export const getUserBoards = (token, secret) => {

  return new Promise((resolve, reject) => {
    oauth.get('https://api.trello.com/1/members/me/boards', token, secret, (e, data) => {
      if (e) {
        reject(e)
      }

      resolve(JSON.parse(data))
    })
  })
}

export const createBoard = (token, secret, name) => {
  return new Promise((resolve, reject) => {
    oauth.post('https://api.trello.com/1/boards', token, secret, { name }, (e, data) => {
      if (e) {
        reject(e)
      }

      resolve(JSON.parse(data))
    })
  })
}
