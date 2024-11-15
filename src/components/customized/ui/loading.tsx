import { Modal, Spin } from 'antd'
import { createRoot } from 'react-dom/client'

let loadingInstance: any = null

interface LoadingProps {
  visible: boolean
  message: string
}

const Loading = ({ visible, message }: LoadingProps) => {
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      maskClosable={false}
      rootClassName=" bg-transparent"
      className="loading-container flex w-auto justify-center bg-transparent p-6"
    >
      <div className="flex justify-center gap-4">
        <div className="text-xl text-black">{message}</div>
        <Spin size="large" className="h-8 w-8" />
      </div>
    </Modal>
  )
}

export const showLoading = (message?: string) => {
  // 如果已经存在loading则不重复创建
  if (loadingInstance) return

  const div = document.createElement('div')
  document.body.appendChild(div)
  const root = createRoot(div)

  root.render(<Loading visible={true} message={message} />)
  loadingInstance = {
    close: () => {
      root.unmount()
      document.body.removeChild(div)
      loadingInstance = null
    },
  }
}

export const closeLoading = () => {
  if (loadingInstance) {
    loadingInstance.close()
  }
}
