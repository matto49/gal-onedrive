import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  isExiting?: boolean
  isNew?: boolean
}

interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'id' | 'isExiting' | 'isNew'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let showToastFunction: ((props: Omit<ToastProps, 'id' | 'isExiting' | 'isNew'>) => void) | null = null

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const showToast = (props: Omit<ToastProps, 'id' | 'isExiting' | 'isNew'>) => {
    const id = Date.now().toString()
    setToasts(prevToasts => [{ ...props, id, isExiting: false, isNew: true }, ...prevToasts])
  }

  useEffect(() => {
    showToastFunction = showToast
    return () => {
      showToastFunction = null
    }
  }, [])

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prevToasts =>
          prevToasts.map((toast, index) => (index === prevToasts.length - 1 ? { ...toast, isExiting: true } : toast))
        )
        setTimeout(() => {
          setToasts(prevToasts => prevToasts.slice(0, -1))
        }, 300) // 等待淡出动画完成
      }, toasts[toasts.length - 1].duration || 3000)

      return () => clearTimeout(timer)
    }
  }, [toasts])

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.map(toast => (toast.id === id ? { ...toast, isExiting: true } : toast)))
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
    }, 300) // 等待淡出动画完成
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center rounded-xl px-4 py-2 shadow-lg transition-all duration-300 ${getBackgroundColor(
              toast.type
            )} ${toast.isNew ? 'animate-slide-down' : ''} ${toast.isExiting ? 'opacity-0' : 'opacity-100'}`}
            role="alert"
            onAnimationEnd={() => {
              if (toast.isNew) {
                setToasts(prevToasts => prevToasts.map(t => (t.id === toast.id ? { ...t, isNew: false } : t)))
              }
            }}
          >
            <div className="mr-3">{getIcon(toast.type)}</div>
            <div>
              <p className="font-bold">{toast.type}</p>
              <p className="text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="-my-1.5 ml-5 inline-flex h-8 w-8 rounded-lg p-1.5 hover:bg-gray-100"
            >
              <span className="sr-only">关闭</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast必须在ToastProvider内使用')
  }
  return context.showToast
}

export const toast = {
  show: (props: Omit<ToastProps, 'id' | 'isExiting' | 'isNew'>) => {
    if (showToastFunction) {
      showToastFunction(props)
    } else {
      console.warn('Toast提供者未初始化')
    }
  },
  success: (message: string, duration?: number) => toast.show({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => toast.show({ message, type: 'error', duration }),
  info: (message: string, duration?: number) => toast.show({ message, type: 'info', duration }),
  warning: (message: string, duration?: number) => toast.show({ message, type: 'warning', duration }),
}

function getBackgroundColor(type: ToastProps['type']) {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-700'
    case 'error':
      return 'bg-red-100 text-red-700'
    case 'warning':
      return 'bg-yellow-100 text-yellow-700'
    case 'info':
    default:
      return 'bg-blue-100 text-blue-700'
  }
}

function getIcon(type: ToastProps['type']) {
  switch (type) {
    case 'success':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          ></path>
        </svg>
      )
    default:
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          ></path>
        </svg>
      )
  }
}
