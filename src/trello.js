import oauth from './oauth.js'

const apiBase = 'https://api.trello.com/1'

function request(type, path, token, secret, data) {

  if (!['get', 'post', 'put', 'delete'].includes(type)) {
    throw new Error('request type not supported')
  }

  const method = oauth[type]

  return new Promise((resolve, reject) => {
    function resolveReject(e, data) {
      if (e) {
        reject(e)
      }
      resolve(JSON.parse(data))
    }

    if (data) {
      method.call(oauth, `${apiBase}/${path}`, token, secret, data, resolveReject)
    } else {
      method.call(oauth, `${apiBase}/${path}`, token, secret, resolveReject)
    }
  })
}

export const labelColors = {
  green: 'green',
  yellow: 'yellow',
  orange: 'orange',
  red: 'red',
  purple: 'purple',
  blue: 'blue',
  lime: 'lime',
  pink: 'pink',
  black: 'black'
}

export const getUserBoards = (token, secret) => {
  return request('get', 'members/me/boards', token, secret)
}

export const getLists = (token, secret, { boardId }) => {
  return request('get', `boards/${boardId}/lists`, token, secret)
}

export const getBoardIdForList = (token, secret, { listId }) => {
  return request('get', `lists/${listId}/idBoard`, token, secret).then(result => result['_value'])
}

export const createBoard = (token, secret, { name }) => {
  return request('post', 'boards', token, secret, { name })
}

export const createList = (token, secret, { name, boardId }) => {
  return request('post', 'lists', token, secret, { name, idBoard: boardId })
}

export const createCard = (token, secret, { listId, name, description, position }) => {
  return request('post', 'cards', token, secret, { idList: listId, name, desc: description, position, due: null })
}

export const createLabel = (token, secret, { boardId, name, color }) => {
  return request('post', 'labels', token, secret, { idBoard: boardId, name, color })
}

export const clearLabels = (token, secret, { boardId }) => {
  return request('get', `boards/${boardId}/labels`, token, secret).then(labels => {
    return Promise.all(labels.map(label => {
      return request('delete', `labels/${label.id}`, token, secret)
    }))
  })
}

export const clearCards = (token, secret, { listId }) => {
  return request('get', `lists/${listId}/cards`, token, secret).then(cards => {
    return Promise.all(cards.map(card => {
      return request('delete', `cards/${card.id}`, token, secret)
    }))
  })
}
