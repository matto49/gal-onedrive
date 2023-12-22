import { onedriveRequest } from '.'
import { ListData } from '../typescript'

export enum Status {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export type checkStatus = 'approved' | 'failed'

interface UploadSuccessDto {
  userName: string
  qqAccount: string
  path: string
  content: string
  fileList: string[]
  createTime: string
  status?: Status
}

export interface FileInfo {
  id: number
  belongTo: number
  path: string
}

export type UploadList = Omit<UploadSuccessDto, 'fileList'> & {
  fileList: FileInfo[]
  id: number
}

export const createUploadSession = async (path: string, userName: string): Promise<string> => {
  return (await onedriveRequest.post('/createUploadSession', { path, userName })).data.uploadUrl
}

export const uploadSuccess = async (data: UploadSuccessDto) => {
  return await onedriveRequest.post('/uploadSuccess', data)
}

export const getUploadList = async (page?: number, size?: number): Promise<ListData<UploadList>> => {
  return (
    await onedriveRequest.get('/getUploadList', {
      params: {
        page,
        size,
      },
    })
  ).data
}

export const checkUploadList = async (id: number, status: checkStatus) => {
  return (
    await onedriveRequest.post('/checkUploadList', {
      id,
      status,
    })
  ).data
}
