import { onedriveRequest } from '.'

export enum Status {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

interface UploadSuccessDto {
  userName: string
  qqAccount: string
  path: string
  content: string
  fileList: string[]
  createTime: string
  isApproved: boolean
  status: Status
}

export type UploadList = Omit<UploadSuccessDto, 'fileList'> & {
  fileList: {
    id: number
    belongTo: number
    path: string
  }[]
}

export const createUploadSession = async (path: string): Promise<string> => {
  return (await onedriveRequest.post('/createUploadSession', { path })).data.uploadUrl
}

export const uploadSuccess = async (data: UploadSuccessDto) => {
  return await onedriveRequest.post('/uploadSuccess', data)
}

export const getUploadList = async (page?: number, size?: number): Promise<UploadList[]> => {
  return await onedriveRequest.get('/getUploadList', {
    params: {
      page,
      size,
    },
  })
}
