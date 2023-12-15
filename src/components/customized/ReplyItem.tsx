import Image from 'next/image'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { FC, useState } from 'react'
import { ReplyBox } from './ReplyBox'
import { Reply } from '../../utils/api/reply'

interface ReplyProps {
  data: Reply
}

export const ReplyItem: FC<ReplyProps> = ({ data }) => {
  const [replyId, setReplyId] = useState('')

  function handleClickReply() {
    if (replyId === data.id) {
      setReplyId('')
    } else {
      setReplyId(data.id)
    }
  }

  return (
    <div className="mt-8 flex w-full">
      <div>
        <Image
          className="rounded-full"
          width={48}
          height={48}
          alt="avatar"
          src={data.avatar || 'https://shiraha.cn/favicon/me/2023.jpg'}
        />
      </div>
      <div className="flex-1 pl-3">
        <div className="flex items-center">
          <div>{data.userName}</div>
          <div className="ml-3 text-sm text-gray-400">#{data.id}</div>
          <div className="ml-3 text-sm text-gray-400">{formatModifiedDateTime(data.createTime)}</div>
        </div>
        <div className="my-3">{data.content}</div>
        <div onClick={() => handleClickReply()} className="cursor-pointer text-sm">
          {replyId === data.id ? '取消回复' : '回复'}
        </div>
        {replyId === data.id && (
          <div className="mt-8">
            <ReplyBox handleCancel={() => setReplyId('')} replyTo={data.id} />
          </div>
        )}
        {data.children.map((reply, index) => (
          <div key={reply.uniqueId} className="mt-8">
            <ReplyItem data={reply} />
          </div>
        ))}
      </div>
    </div>
  )
}
