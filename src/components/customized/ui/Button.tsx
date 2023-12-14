import clsx from 'clsx'
import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import type { FC } from 'react'

interface ButtonProps {
  bg?: string
}

type BButtonProps = ButtonProps & HTMLMotionProps<'button'>

export const Button: FC<BButtonProps> = props => {
  const { className, bg = 'primary', ...rest } = props
  return (
    <motion.button
      className={clsx(
        `hover:bg-primary-dark rounded-2xl bg-${bg} px-4 py-2 text-sm font-medium text-white disabled:bg-gray-500`,
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
