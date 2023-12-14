import Image from 'next/image'
import { ReplyBox } from './ReplyBox'
import { Reply } from './Reply'

export const ReplyZone = () => {
  function handleSubmit() {}

  return (
    <div className="text-normal-text dark:text-dark-text">
      <div className="my-4 border-l-2 border-l-primary pl-4 text-lg dark:text-gray-100">共114条评论</div>
      <ReplyBox onSubmit={handleSubmit} replyTo="" />
      <Reply />
    </div>
  )
}
