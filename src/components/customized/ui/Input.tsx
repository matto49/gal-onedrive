import {
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type InputProps = {
  prefixIcon?: JSX.Element
  muti?: boolean
  wrappedProps?: HTMLAttributes<HTMLSpanElement>
}

type IInputProps = InputProps & InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>

export const Input = memo(
  forwardRef<HTMLInputElement | HTMLTextAreaElement, IInputProps>((props, ref) => {
    const { muti, wrappedProps, prefix, onChange, value, ...rest } = props

    const [focus, setFocus] = useState(false)

    const [size, setSize] = useState({ width: 0, height: 0 })
    const C = useMemo(() => {
      return (size.width + size.height) * 2
    }, [size])
    const inputWrappedRef = useRef<HTMLSpanElement>(null)
    useEffect(() => {
      const InputWrapEle = inputWrappedRef.current
      if (InputWrapEle) {
        const resizeObserver = new ResizeObserver(entries => {
          const Input = entries[0]
          const { clientHeight, clientWidth } = Input.target
          setSize({ width: clientWidth, height: clientHeight })
        })

        resizeObserver.observe(InputWrapEle)

        return () => {
          resizeObserver.unobserve(InputWrapEle)
          resizeObserver.disconnect()
        }
      }
    }, [inputWrappedRef])

    return (
      <span
        className="relative inline-flex w-full items-center  border border-gray-300 py-2.75 px-3 text-normal-text hover:border-primary dark:border-gray-600 dark:text-dark-text"
        {...wrappedProps}
        ref={inputWrappedRef}
      >
        {prefix && <div className="relative mr-1 inline-block">{prefix}</div>}
        <div className="pointer-events-none absolute left-0 top-0">
          <svg className="h-1 w-1 overflow-visible">
            <rect
              className={`stroke-primary transition-all duration-500`}
              height={size.height}
              width={size.width}
              style={{
                strokeDasharray: `${C}px`,
                strokeDashoffset: !focus ? `${C}px` : 0,
                shapeRendering: 'crispEdges',
                strokeWidth: '1.5px',
                fill: 'transparent',
              }}
            ></rect>
          </svg>
        </div>
        {muti ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={value}
            onChange={onChange}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className="block w-full border-0 bg-transparent outline-none"
            {...rest}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            value={value}
            onChange={onChange}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className="block w-full border-0 bg-transparent outline-none"
            {...rest}
          />
        )}
      </span>
    )
  })
)
