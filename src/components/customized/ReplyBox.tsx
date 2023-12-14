import { FC, useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { setElementWrapper } from '../../utils/customized'
import UserIcon from '../../static/customized/user.svg'
import QQIcon from '../../static/customized/qq.svg'

interface BoxContent {
  text: string
  userName: string
  account: string
}

interface ReplyBoxProps {
  onSubmit: (content: BoxContent) => void
  handleCancel?: () => void
  replyTo?: string
}

export const ReplyBox: FC<ReplyBoxProps> = ({ onSubmit, replyTo, handleCancel }) => {
  const [userName, setUserName] = useState('')
  const [account, setAccount] = useState('')

  const [text, setText] = useState('')
  const disabled = useMemo(() => {
    return !(userName && account && text)
  }, [userName, account, text])

  function handleSubmit() {
    const data = {
      userName,
      account,
      text,
    }

    localStorage.setItem('REPLY_INFO', JSON.stringify({ userName, account }))

    onSubmit(data)
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
          value={account}
          onChange={setElementWrapper(setAccount)}
          name="account"
        />
      </div>
      <div className="mt-6">
        <Input placeholder="输入一条友善的评论~" value={text} onChange={setElementWrapper(setText)} muti />
      </div>
      <div className="mt-4 flex justify-end gap-8">
        <Button bg="transparent" className="border-2 border-red-400 text-red-400" type="submit" onClick={handleCancel}>
          取消发送
        </Button>
        <Button disabled={disabled} type="submit" onClick={handleSubmit}>
          发送
        </Button>
      </div>
    </div>
  )
}
