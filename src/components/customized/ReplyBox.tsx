import { FC, useContext, useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { setElementWrapper } from '../../utils/customized'
import UserIcon from '../../static/customized/user.svg'
import QQIcon from '../../static/customized/qq.svg'
import { ReplyParams } from '../../utils/api/reply'
import { submitContext } from './ReplyZone'

interface ReplyBoxProps {
  handleCancel?: () => void
  replyTo?: string
}

export const ReplyBox: FC<ReplyBoxProps> = ({ replyTo = '', handleCancel }) => {
  const onSubmit = useContext(submitContext).submit
  const [userName, setUserName] = useState('')
  const [qqAccount, setQQAccount] = useState('')

  const [content, setContent] = useState('')
  const disabled = useMemo(() => {
    return !(userName && qqAccount && content)
  }, [userName, qqAccount, content])

  function handleSubmit() {
    const data = {
      userName,
      qqAccount,
      content,
    }

    localStorage.setItem('REPLY_INFO', JSON.stringify({ userName, qqAccount }))

    onSubmit(replyTo, data)
  }

  return (
    <div>
      <div className="flex gap-4">
        <Input
          prefixIcon={<UserIcon />}
          placeholder="昵称"
          value={userName}
          onChange={setElementWrapper(setUserName)}
          name="author"
        />
        <Input
          prefixIcon={<QQIcon />}
          placeholder="群友的qq"
          value={qqAccount}
          onChange={setElementWrapper(setQQAccount)}
          name="account"
        />
      </div>
      <div className="mt-6">
        <Input placeholder="输入一条友善的评论~" value={content} onChange={setElementWrapper(setContent)} muti />
      </div>
      <div className="mt-4 flex justify-end gap-8">
          {replyTo && (
            <Button
              bg="transparent"
              className="border-2 border-red-400 text-red-400"
              type="submit"
              onClick={handleCancel}
            >
              取消发送
            </Button>
          )}
        <Button disabled={disabled} type="submit" onClick={handleSubmit}>
          发送
        </Button>
      </div>
    </div>
  )
}
