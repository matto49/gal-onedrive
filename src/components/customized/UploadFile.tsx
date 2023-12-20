import { App, UploadProps, Upload, Progress } from 'antd'
import { UploadRef } from 'antd/es/upload/Upload'
import { useMemo, useRef, useState } from 'react'
import { Button } from './ui/Button'
import axios from 'axios'
import { createUploadSession, uploadSuccess } from '../../utils/api/onedrive'
import Image from 'next/image'
import RubbishIcon from '../../static/customized/rubbish.svg'
import UserIcon from '../../static/customized/user.svg'
import QQIcon from '../../static/customized/qq.svg'
import { useImmer } from 'use-immer'
import { Input } from './ui/Input'
import { setElementWrapper } from '../../utils/customized'
import { useRouter } from 'next/router'
import { queryToPath } from '../FileListing'

interface UploadFileProgress {
  size: number
  progress: number
  percent: number
}

const { Dragger } = Upload
export const UploadFile = () => {
  const { query } = useRouter()
  const curPath = queryToPath(query)
  // 本地上传结束后可以上传
  const [canUpload, setCanUploading] = useState(false)

  // 服务器上传信息
  const [uploadFilesProgress, updateUploadFilesProgress] = useImmer<UploadFileProgress[]>([])

  const { message } = App.useApp()
  const draggerRef = useRef<UploadRef<any>>(null)

  function handleUpload() {
    const list = draggerRef.current?.fileList
    if (!list || !list.length) {
      message.error('还没有选择任何文件哦')
    } else {
      updateUploadFilesProgress(list.map(file => ({ size: file.size || 0, progress: 0, percent: 0 })))
      const handles = list.map(({ originFileObj }, idx) => {
        if (originFileObj) {
          return uploadFileByChunk(idx, originFileObj)
        }
      })
      Promise.all(handles)
        .then(async () => {
          await uploadSuccess({
            userName,
            qqAccount,
            path: curPath + prefixDir,
            content,
            createTime: Date().toString(),
            fileList: list.map((file: any) => file.name),
          })
          message.success('上传成功')
        })
        .catch(err => {
          message.error('上传失败')
        })
    }
  }

  //生成文件切片
  async function uploadFileByChunk(fileIdx: number, file: File, size = 100 * 1024 * 1024) {
    const fileChunkList: any[] = []
    const fileSize = file.size
    let cur = 0

    const uploadUri = await createUploadSession(`${curPath + prefixDir}/${file.name}`)
    try {
      while (cur < file.size) {
        const slice = file.slice(cur, cur + size)
        await axios.put(uploadUri, slice, {
          headers: {
            'Content-Range': `bytes ${cur}-${Math.min(cur + size - 1, fileSize - 1)}/${fileSize}`,
          },
          onUploadProgress(data) {
            const uploadSize = cur + data.loaded
            updateUploadFilesProgress(uploadFilesProgress => {
              uploadFilesProgress[fileIdx].progress = uploadSize
              uploadFilesProgress[fileIdx].percent = Number(((uploadSize / fileSize) * 100).toFixed(1))
            })
          },
        })
        cur += size
      }
    } catch (err) {
      message.error(`文件${file.name}上传失败`)
      throw err
    }

    return fileChunkList
  }

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    onRemove(file) {},
    onChange(info) {
      const { status } = info.file
      console.log(info)
      const uploadOver = info.fileList.every(file => file.status === 'done')
      if (uploadOver) {
        message.success('文件加载完成')
        setCanUploading(true)
      } else if (canUpload === true) {
        setCanUploading(false)
      }

      if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    },

    itemRender(originNode, file, fileList, actions) {
      const fileIdx = fileList.findIndex(item => item.uid === file.uid)
      const fileProgress = uploadFilesProgress[fileIdx]

      function handleSize(size: number) {
        if (size > 1024 * 1024 * 1024) {
          return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`
        } else if (size > 1024 * 1024) {
          return `${(size / 1024 / 1024).toFixed(2)}MB`
        } else if (size > 1024) {
          return `${(size / 1024).toFixed(2)}KB`
        } else return 0
      }

      const conicColors = { '0%': '#87d068', '50%': '#ffe58f', '100%': '#ffccc7' }

      return (
        <div className="mt-3 flex items-center gap-5 dark:text-gray-400">
          <span>{file.name}</span>
          <Button onClick={actions.remove}>
            <RubbishIcon className="h-4 w-4 cursor-pointer hover:text-primary" />
          </Button>
          {fileProgress && (
            <div className="flex items-center gap-6">
              <div className="w-40">
                <Progress className="mb-1" strokeColor={conicColors} percent={fileProgress.percent} />
              </div>
              <div className="text-sm">
                {handleSize(fileProgress.progress)}/{handleSize(fileProgress.size)}
              </div>
            </div>
          )}
        </div>
      )
    },
  }

  const [userName, setUserName] = useState('')
  const [qqAccount, setQQAccount] = useState('')
  const [prefixDir, setPrefixDir] = useState('')

  const [content, setContent] = useState('')
  const disabled = useMemo(() => {
    return !(userName && qqAccount && !content)
  }, [userName, qqAccount, content])

  return (
    <div className="mt-10">
      <Dragger {...props} ref={draggerRef}>
        <p className="ant-upload-drag-icon flex justify-center">
          <Image
            alt="upload"
            className="rounded-full"
            src="https://s3.bmp.ovh/imgs/2023/12/17/d978781447a01a0c.png"
            width={64}
            height={64}
          ></Image>
        </p>
        <p className="font-semibold dark:text-gray-400">点击选择或者拖拽上传文件~</p>
      </Dragger>
      <div className="mt-8">
        <div className="flex gap-4">
          <Input
            prefixIcon={<UserIcon />}
            placeholder="昵称"
            value={userName}
            onChange={setElementWrapper(setUserName)}
            required
            name="author"
          />
          <Input
            prefixIcon={<QQIcon />}
            placeholder="群友的qq"
            value={qqAccount}
            onChange={setElementWrapper(setQQAccount)}
            required
            name="account"
          />
        </div>
        <Input
          wrappedProps={{ className: 'mt-4' }}
          placeholder="创建新的文件夹以上传(/樱之响 就是在当前目录创建一个樱之响的文件夹，在当前文件夹上传不填)"
          value={prefixDir}
          onChange={setElementWrapper(setPrefixDir)}
          name="account"
        />
        <div className="mt-6">
          <Input
            placeholder="为本次上传做一点见要说明吧(不填默认是昵称-日期的形式)"
            value={content}
            onChange={setElementWrapper(setContent)}
            muti
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          disabled={!canUpload || disabled}
          className="mt-2 border-2 border-primary disabled:border-none disabled:text-gray-400"
          onClick={handleUpload}
        >
          上传至服务器
        </Button>
      </div>
    </div>
  )
}
