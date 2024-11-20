import { App, UploadProps, Upload, Progress, UploadFile, Switch } from 'antd'
import { UploadRef } from 'antd/es/upload/Upload'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './ui/Button'
import axios, { AxiosError } from 'axios'
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
import { RcFile } from 'antd/es/upload'
import { useToast } from './ui/message'
import { closeLoading, showLoading } from './ui/loading'

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

export const UploadFiles = () => {
  const { query } = useRouter()
  const curPath = queryToPath(query)

  // 用于取消一个或多个 Web 请求
  const [abortControllers, setAbortControllers] = useImmer<Record<string, AbortController>>({})

  const [isDirectoryUpload, setIsDirectoryUpload] = useState(false)

  // 文件上传信息
  const [fileList, updateFileList] = useImmer<UploadFileProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const toast = useToast()
  const draggerRef = useRef<UploadRef<any>>(null)

  // 考虑到暂停上传情况，放上传的回调函数里了
  async function uploadFinCallback() {
    await uploadSuccess({
      userName,
      qqAccount,
      path: curPath + prefixDir,
      content,
      createTime: Date().toString(),
      fileList: fileList.map(({ file }) => file.name),
    })

    toast({
      type: 'success',
      message: '全部上传成功，需要联系管理员审核哦~',
    })
    localStorage.setItem(LOCAL_STORAGE_USER_INFO, JSON.stringify({ userName, qqAccount }))
    setIsUploading(false)
    if (draggerRef.current) draggerRef.current.fileList = []
  }

  async function handleUpload() {
    try {
      updateFileList(fileList => fileList.filter(item => item.status !== 'done'))
      if (!fileList || !fileList.length) {
        toast({
          type: 'error',
          message: '还没有选择任何文件哦',
        })
      } else {
        setIsUploading(true)
        for (let i = 0; i < fileList.length; i++) {
          const originFileObj = fileList[i].file
          if (originFileObj) {
            const url = await initOnedriveUpload(i)
            await uploadFileByChunk(fileList[i].file, url)
          }
        }
      }
    } catch (err) {
      if (err && (err as any).message === 'canceled') {
        return
      }
      toast({
        type: 'error',
        message: '上传失败' + err,
      })
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
  useEffect(() => {
    if (fileList.length && fileList.every(item => item.status === 'done')) {
      uploadFinCallback()
    }
  }, [fileList])
  async function uploadFileByChunk(
    file: RcFile,
    url = '',
    start = 0,
    signal?: AbortSignal,
    chunkSize = 30 * 1024 * 1024 // 使用10MB的块大小
  ) {
    const fileIdx = fileList.findIndex(item => item.uid === file.uid)

    if (!signal) {
      const controller = new AbortController()
      setAbortControllers(draft => {
        draft[file.uid] = controller
      })
      signal = controller.signal
    }

    const fileSize = file.size

    updateFileList(uploadFiles => {
      uploadFiles[fileIdx].status = 'uploading'
    })

    let cur = start
    while (cur < fileSize) {
      try {
        // 确保块大小是320KB的倍数
        const adjustedChunkSize = Math.floor(chunkSize / (320 * 1024)) * (320 * 1024)
        const end = Math.min(cur + adjustedChunkSize, fileSize)
        const slice = file.slice(cur, end)

        await axios.put(url || fileList[fileIdx].url, slice, {
          headers: {
            'Content-Range': `bytes ${cur}-${end - 1}/${fileSize}`,
            'Content-Length': `${end - cur}`,
          },
          onUploadProgress(data) {
            const uploadSize = cur + data.loaded
            updateFileList(uploadFiles => {
              uploadFiles[fileIdx].progress = uploadSize
              uploadFiles[fileIdx].percent = Number(((uploadSize / fileSize) * 100).toFixed(1))
            })
          },
          signal: signal,
        })
        cur = end
      } catch (err) {
        const error = err as AxiosError
        if (error.message === 'canceled') {
          updateFileList(uploadFiles => {
            uploadFiles[fileIdx].status = 'stopped'
          })
          return
        }

        // 对5xx错误进行重试
        if (error.response && error.response.status >= 500 && error.response.status < 600) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒后重试
          continue
        }
        throw err
      }
    }
    updateFileList(uploadFiles => {
      uploadFiles[fileIdx].status = 'done'
    })
    toast({
      type: 'success',
      message: `${file.name}上传成功，请等待其它文件上传~`,
    })
  }

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    onRemove(file) {
      updateFileList(preList => {
        const idx = preList.findIndex(item => item.uid === file.uid)
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

      async function handleCancelUpload() {
        try {
          if (fileInfo.url) {
            if (abortControllers[fileInfo.uid]) {
              abortControllers[fileInfo.uid].abort()
              setAbortControllers(draft => {
                delete draft[fileInfo.uid]
              })
            }
            updateFileList(uploadFiles => {
              uploadFiles[fileIdx].status = 'stopped'
            })
            // await axios.delete(fileInfo.url)
            toast({
              type: 'success',
              message: '已暂停上传',
            })
          }
        } catch (err) {
          closeLoading()
        }
      }

      async function handleRestoreUpload() {
        if (fileInfo.url) {
          try {
            // 获取已上传的字节范围
            showLoading('恢复上传中')
            const response = await axios.get(fileInfo.url)
            const nextRange = response.data.nextExpectedRanges[0]
            const startByte = parseInt(nextRange.split('-')[0])
            closeLoading()

            // 从断点处继续上传
            await uploadFileByChunk(fileInfo.file, fileInfo.url, startByte)
          } catch (err) {
            closeLoading()
            toast({
              type: 'error',
              message: '恢复上传失败',
            })
          }
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
          {fileInfo.status !== 'uploading' && (
            <Button onClick={actions.remove}>
              <RubbishIcon className="h-4 w-4 cursor-pointer hover:text-primary" />
            </Button>
          )}
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
    return () => {
      Object.values(abortControllers).forEach(controller => {
        controller.abort()
      })
    }
  }, [])

  const [content, setContent] = useState('')
  const disabled = useMemo(() => {
    return !(userName && qqAccount)
  }, [userName, qqAccount, content])

  return (
    <div>
      <div className="my-3 flex items-center gap-4">
        <span>按文件夹上传</span>
        <Switch onChange={() => setIsDirectoryUpload(pre => !pre)} />
      </div>
      <Dragger {...props} ref={draggerRef} directory={isDirectoryUpload}>
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
