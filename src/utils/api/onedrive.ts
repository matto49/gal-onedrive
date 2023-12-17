import { onedriveRequest } from '.'
export const createUploadSession = async (path: string): Promise<string> => {
  return (await onedriveRequest.post('/createUploadSession', { path })).data.uploadUrl
}
