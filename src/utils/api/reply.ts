import { request } from './index'

export interface ReplyParams {
  content: string
  userName: string
  qqAccount: string
}

export interface Reply {
  content: string
  userName: string
  qqAccount: string
  createTime: string
  uniqueId: number
  pageUrl: string
  isPrimaryReply: boolean
  id: string
  avatar: string
  children: Reply[]
}

export interface ListInfo {
  total: number
  list: Reply[]
}

export const getReply = (pageUrl: string, page = 1, size = 20): Promise<ListInfo> => {
  return request.get('/list', {
    params: {
      pageUrl,
      page,
      size,
    },
  })
}

export const addReply = (pageUrl: string, replyTo: string, reply: ReplyParams): Promise<string> => {
  return request.post('/add', {
    pageUrl,
    replyTo,
    reply,
  })
}
