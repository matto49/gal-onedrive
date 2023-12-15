import axios from 'axios'

export const request = axios.create({
  baseURL: '/onedrive/reply',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.response.use(res => res.data)
