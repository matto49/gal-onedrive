import clsx from 'clsx'
import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import type { FC } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'plain'
}

type BButtonProps = HTMLMotionProps<'button'> & ButtonProps

export const Button: FC<BButtonProps> = props => {
  const { className, variant = 'primary', ...rest } = props
  return (
    <motion.button
      className={clsx(
        `hover:bg-primary-dark rounded-2xl px-4 py-2 text-sm font-medium  disabled:bg-gray-500`,
        variant === 'primary' && 'bg-primary text-white',
        variant === 'plain' && 'bg-transparent text-primary dark:text-white border-primary border-solid border-2',
        className
      )}
      whileTap={{
        scale: 0.9,
      }}
      whileHover={{
        shadow: '0 0 10px rgb(120 120 120 / 10%), 0 5px 20px rgb(120 120 120 / 20%)',
        scale: 1.1,
      }}
      {...rest}
    >
      {props.children}
    </motion.button>
  )
}
