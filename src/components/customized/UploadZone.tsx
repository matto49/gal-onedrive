import { useState } from 'react'
import { Button } from './ui/Button'
import { UploadFiles } from './UploadFile'
import Link from 'next/link'

export const UploadZone = () => {
  const [uploadShow, setUploadShow] = useState(false)
  return (
    <>
      <Button
        className="mt-8 bg-primary"
        onClick={() => {
          setUploadShow(val => !val)
        }}
      >
        {uploadShow ? '不用上传力' : '我要上传文件~'}
      </Button>
      {uploadShow && (
        <>
          <div className="mt-4">
            上传前请阅读我们的
            <Link target="_blank" href="https://doc.aoikaze.org/blog/oneindex/archive_format">
              压缩要求
            </Link>
            和
            <Link target="_blank" href="https://doc.aoikaze.org/blog/oneindex/upload_format">
              上传要求
            </Link>
            哦~
          </div>
          <UploadFiles />
        </>
      )}
    </>
  )
}
