import { useState } from 'react'
import { Button } from './ui/Button'
import { UploadFile } from './UploadFile'

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
      {uploadShow && <UploadFile />}
    </>
  )
}
