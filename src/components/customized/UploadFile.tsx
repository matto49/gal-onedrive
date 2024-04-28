import { App, UploadProps, Upload, Progress, UploadFile } from 'antd'
import { UploadRef } from 'antd/es/upload/Upload'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './ui/Button'
import axios from 'axios'
import { createUploadSession, uploadSuccess } from '../../utils/api/onedrive'
import Image from 'next/image'
import RubbishIcon from '../../static/customized/rubbish.svg'
import UserIcon from '../../static/customized/user.svg'
import QQIcon from '../../static/customized/qq.svg'
import { useImmer } from 'use-immer'
import { Input } from './ui/Input'
import { LOCAL_STORAGE_USER_INFO, setElementWrapper } from '../../utils/customized'
import { useRouter } from 'next/router'
import { queryToPath } from '../FileListing'
import { flushSync } from 'react-dom'
import { RcFile } from 'antd/es/upload'

interface UploadFileProgress {
  // RcFile的uid
  uid: string
  size: number
  progress: number
  percent: number
  url: string
  status: 'preparing' | 'uploading' | 'done' | 'stopped' | 'error'
  file: RcFile
}

const { Dragger } = Upload
const abortController = new AbortController()

export const UploadFiles = () => {
  const { query } = useRouter()
  const curPath = queryToPath(query)

  // 文件上传信息
  const [fileList, updateFileList] = useImmer<UploadFileProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { message } = App.useApp()
  const draggerRef = useRef<UploadRef<any>>(null)

  async function handleUpload() {
    if (!fileList || !fileList.length) {
      message.error('还没有选择任何文件哦')
    } else {
      for (let i = 0; i < fileList.length; i++) {
        const originFileObj = fileList[i].file
        if (originFileObj) {
          const url = await initOnedriveUpload(i)
          await uploadFileByChunk(fileList[i].file, url)
        }
      }
      await uploadSuccess({
        userName,
        qqAccount,
        path: curPath + prefixDir,
        content,
        createTime: Date().toString(),
        fileList: fileList.map(({ file }) => file.name),
      })
      message.success('上传成功')
      localStorage.setItem(LOCAL_STORAGE_USER_INFO, JSON.stringify({ userName, qqAccount }))
    }
  }

  // onedriveApi侧暂停上传
  async function cancelUpload(fileIdx: number) {
    const file = fileList[fileIdx]
    if (file.url) {
      await axios.delete(file.url)
    }
  }

  //  获取从onedrive那边获取到的上传文件的url
  async function initOnedriveUpload(fileIdx: number): Promise<string> {
    const fileInfo = fileList[fileIdx]

    const uploadUri = await createUploadSession(`${curPath + prefixDir}/${fileInfo.file.name}`, userName)

    // 设置url供取消上传用
    updateFileList(uploadFiles => {
      uploadFiles[fileIdx].url = uploadUri
    })
    return uploadUri
  }

  // 上传文件
  // 传url用于解决useImmer中的数据统一更新问题
  async function uploadFileByChunk(file: RcFile, url = '', start = 0, size = 200 * 1024 * 1024) {
    const fileIdx = fileList.findIndex(item => item.uid === file.uid)
    const fileSize = file.size

    let cur = start
    try {
      while (cur < fileSize) {
        const slice = file.slice(cur, cur + size)
        await axios.put(url || fileList[fileIdx].url, slice, {
          headers: {
            'Content-Range': `bytes ${cur}-${Math.min(cur + size - 1, fileSize - 1)}/${fileSize}`,
          },
          onUploadProgress(data) {
            const uploadSize = cur + data.loaded
            updateFileList(uploadFiles => {
              uploadFiles[fileIdx].progress = uploadSize
              uploadFiles[fileIdx].percent = Number(((uploadSize / fileSize) * 100).toFixed(1))
              uploadFiles[fileIdx].status = 'uploading'
              console.log(uploadFiles)
            })
          },
          signal: abortController.signal,
        })
        cur += size
      }

      updateFileList(uploadFiles => {
        console.log(uploadFiles)
        uploadFiles[fileIdx].status = 'done'
      })
    } catch (err) {
      // if (fileList[fileIdx].status === 'stopped') return
      updateFileList(uploadFiles => {
        uploadFiles[fileIdx].status = 'error'
      })
      message.error(`文件${file.name}上传失败`)
      throw err
    }
  }

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    onRemove(file) {
      console.log('onRemove', fileList, file)
      updateFileList(preList => {
        const idx = preList.findIndex(item => item.uid === file.uid)
        console.log('onRemove2', idx)
        preList.splice(idx, 1)
      })
    },
    beforeUpload: file => {
      updateFileList(preList => {
        preList.push({
          uid: file.uid,
          file: file,
          size: file.size || 0,
          progress: 0,
          percent: 0,
          url: '',
          status: 'preparing',
        })
      })
      return false
    },

    itemRender(originNode, file, list, actions) {
      const fileIdx = fileList.findIndex(item => item.uid === file.uid)
      const fileInfo = fileList[fileIdx]
      if (!fileInfo) return

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

      function handleUploadChange() {
        if (fileInfo.status === 'uploading') {
          handleCancelUpload()
        } else if (fileInfo.status === 'stopped') {
          handleRestoreUpload()
        }
      }

      // 有问题，请求后并没有实现暂停效果，感觉还得处理一下发出去的put请求
      async function handleCancelUpload() {
        if (fileInfo.url) {
          updateFileList(uploadFiles => {
            uploadFiles[fileIdx].status = 'stopped'
          })
          abortController.abort()
          await axios.delete(fileInfo.url)
          message.success('取消文件上传成功')
        }
      }

      async function handleRestoreUpload() {
        if (fileInfo.url) {
          const start = (await axios.get(fileInfo.url)).data.nextExpectedRanges
          console.log('restore', start)
          // message.success('恢复文件上传成功')
        }
      }
      const handleButtons = {
        uploading: {
          text: '暂停上传',
          onClick: handleCancelUpload,
        },
        stopped: {
          text: '恢复上传',
          onClick: handleRestoreUpload,
        },
      }
      const handleButton = handleButtons[fileInfo.status]

      return (
        <div className="mt-3 flex items-center gap-5 dark:text-gray-400">
          <span>{file.name}</span>
          <Button onClick={actions.remove}>
            <RubbishIcon className="h-4 w-4 cursor-pointer hover:text-primary" />
          </Button>
          {fileInfo && (
            <div className="flex items-center gap-6">
              <div className="w-40">
                <Progress className="mb-1" strokeColor={conicColors} percent={fileInfo.percent} />
              </div>
              <div className="text-sm">
                {handleSize(fileInfo.progress)}/{handleSize(fileInfo.size)}
              </div>
              {handleButton && <Button onClick={handleButton.onClick}>{handleButton.text}</Button>}
            </div>
          )}
        </div>
      )
    },
  }

  const [userName, setUserName] = useState('')
  const [qqAccount, setQQAccount] = useState('')
  const [prefixDir, setPrefixDir] = useState('')

  useEffect(() => {
    const storageInfo = localStorage.getItem(LOCAL_STORAGE_USER_INFO)
    if (storageInfo) {
      const { userName, qqAccount } = JSON.parse(storageInfo)
      setUserName(userName)
      setQQAccount(qqAccount)
    }
  }, [])

  const [content, setContent] = useState('')
  const disabled = useMemo(() => {
    return !(userName && qqAccount)
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
          disabled={isUploading || disabled}
          className="mt-2 border-2 border-primary disabled:border-none disabled:text-gray-400"
          onClick={handleUpload}
        >
          上传至服务器
        </Button>
      </div>
    </div>
  )
}
