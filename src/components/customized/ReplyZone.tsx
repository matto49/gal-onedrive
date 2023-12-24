import Image from 'next/image'
import { ReplyBox } from './ReplyBox'
import { ReplyItem } from './ReplyItem'
import { FC, useEffect } from 'react'
import { ReplyParams, addReply, getReply } from '../../utils/api/reply'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import Loading from '../Loading'
import { App } from 'antd'
import { createContext } from 'react'
import { UploadZone } from './UploadZone'

interface ISubmitContext {
  submit: (replyTo: string, reply: ReplyParams) => void
}

export const submitContext = createContext<ISubmitContext>({} as ISubmitContext)

interface ReplyZoneProps {
  path: string
}

interface addParams {
  replyTo: string
  reply: ReplyParams
}

export const ReplyZone: FC<ReplyZoneProps> = ({ path }) => {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const { mutate, reset } = useMutation((values: addParams) => addReply(path, values.replyTo, values.reply), {
    onSuccess(res) {
      reset()
      if (res === 'createSuccess') {
        message.success('评论成功')
        queryClient.invalidateQueries('reply')
      } else {
        message.error('评论失败')
      }
    },
    onError() {
      message.error('评论失败')
    },
  })

  function handleSubmit(replyTo: string, reply: ReplyParams) {
    mutate({ replyTo, reply })
  }

  const { data, isLoading } = useQuery('reply', () => getReply(path))

  return (
    <submitContext.Provider value={{ submit: handleSubmit }}>
      <div className="text-normal-text dark:text-dark-text">
        {isLoading ? (
          <Loading loadingText="评论加载中" />
        ) : (
          <>
            <div className="my-4 border-l-2 border-l-primary pl-4 text-lg dark:text-gray-100">
              共{data?.total || 0}条评论
            </div>
            <ReplyBox replyTo="" />
            {data?.list?.map(reply => (
              <ReplyItem key={reply.uniqueId} data={reply} />
            ))}
            <UploadZone />
          </>
        )}
      </div>
    </submitContext.Provider>
  )
}
