import axios from 'axios';
import * as types from '@/constant';
import lstore from '@/core/lstorage';

const { lsd } = lstore;

export const GETApi = (url, params = null) => {
  const token = lsd.get('token', null);
  const jsonParams = {};

  if (params) {
    jsonParams.params = params;
  }

  jsonParams.headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/vnd.api+json',
  };

  return axios.get(url, jsonParams)
    .then(res => ({ success: true, data: res.data }))
    .catch(err => ({ success: false, err }));
};

export const POSTApi = (url, data, params = null) => {
  const token = lsd.get('token', null);
  const jsonParams = {};

  if (params) {
    jsonParams.params = params;
  }

  jsonParams.headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/vnd.api+json',
  };

  return axios.post(url, {data}, jsonParams)
    .then(res => ({ success: true, data: res.data }))
    .catch(err => ({ success: false, err }));
};

export const DELETEApi = (url) => {
  const token = lsd.get('token', null);
  return axios.delete(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
    },
  })
    .then(res => ({ success: true, data: res.data }))
    .catch(err => ({ success: false, err }));
};
