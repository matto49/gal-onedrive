import axios from 'axios'

export const request = axios.create({
  baseURL: '/onedrive/reply',
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.response.use(res => res.data)

export const onedriveRequest = axios.create({
  baseURL: '/onedrive/onedriveApi',
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
})
