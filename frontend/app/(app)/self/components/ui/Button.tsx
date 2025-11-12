import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variantClasses = {
      'primary': 'bg-primary text-white hover:bg-primary/90',
      'secondary': 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      'ghost': 'hover:bg-gray-100',
    };

    const sizeClasses = {
      'sm': 'h-8 px-3 text-sm',
      'md': 'h-10 px-4',
      'lg': 'h-12 px-6',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button } 