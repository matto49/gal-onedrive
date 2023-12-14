import Image from 'next/image'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { FC, useState } from 'react'
import { ReplyBox } from './ReplyBox'

interface ReplyProps {
  hasChild?: boolean
}

export const Reply: FC<ReplyProps> = ({ hasChild }) => {
  const [replyId, setReplyId] = useState('1')
  function handleSubmit() {}

  return (
    <div className="flex w-full">
      <div>
        <Image
          className="rounded-full"
          width={48}
          height={48}
          alt="avatar"
          src="https://shiraha.cn/favicon/me/2023.jpg"
        />
      </div>
      <div className="flex-1 pl-3">
        <div className="flex items-center">
          <div>shiraha</div>
          <div className="ml-4 text-sm text-gray-400">{formatModifiedDateTime('2023-12-11 20:00')}</div>
        </div>
        <div className="my-3">评论内容评论内容评论内容评。</div>
        <div onClick={() => setReplyId('')} className="cursor-pointer text-sm">
          回复
        </div>
        {replyId === '1' && (
          <div className="mt-8">
            <ReplyBox onSubmit={handleSubmit} replyTo="" />
          </div>
        )}
        {!hasChild && (
          <div className="mt-8">
            <Reply hasChild />
          </div>
        )}
      </div>
    </div>
  )
}
