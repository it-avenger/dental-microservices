import axios from 'axios'
import * as types from '@/constant'
import lstore from '@/core/lstorage'

const lsd = lstore.lsd

export const GETApi = (url) => {
  const token = lsd.get('token', null)
  return axios.get(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/vnd.api+json'
    }
  })
    .then((res) => {
      return { success: true, data: res.data }
    })
    .catch(err => {
      return { success: false, err: err }
    })
}

export const POSTApi = (url, params) => {
  const token = lsd.get('token', null)

  return axios.post(url, {
    data: params
  }, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/vnd.api+json'
    }
  })
    .then((res) => {
      return res.data.data
    })
}

export const DELETEApi = (url) => {
  const token = lsd.get('token', null)
  return axios.delete(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/vnd.api+json'
    }
  })
    .then((res) => {
      return { success: true, data: res.data }
    })
    .catch(err => {
      return { success: false, err: err }
    })
}