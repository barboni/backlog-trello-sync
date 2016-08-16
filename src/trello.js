import oauth from './oauth.js'

const apiBase = 'https://api.trello.com/1'

function request(type, path, token, secret, data) => {

  if (['get', 'post', 'put', 'delete'].indexOf(type) < 0) {
    throw new Error('request type not supported')
  }

  const method = oauth[type]

  return new Promise((resolve, reject) => {
    function resolveReject(e, data) => {
      if (e) {
        reject(e)
      }
      resolve(JSON.parse(data))
    }

    if (data) {
      method(`${apiBase}/${path}`, token, secret, data, resolveReject)
    } else {
      method(`${apiBase}/${path}`, token, secret, resolveReject)
    }
  })
}

export const getUserBoards = (token, secret) => {
  return request('get', 'members/me/boards', token, secret)
}

export const createBoard = (token, secret, name) => {
  return request('post', 'boards', token, secret, { name })
}

export const createList = (token, secret, name, boardId) => {
  return request('lists', token, secret, { name, idBoard: boardId })
}
