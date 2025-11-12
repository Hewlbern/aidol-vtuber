import type { HTMLAttributes } from 'react'


interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  initials?: string
  imageUrl?: string
}

export function Avatar({ className, size = 'md', initials, imageUrl, ...props }: AvatarProps) {
  const sizeClasses = {
    'sm': 'h-8 w-8 text-sm',
    'md': 'h-10 w-10 text-base',
    'lg': 'h-12 w-12 text-lg',
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-primary text-white font-medium ${sizeClasses[size]} ${className || ''}`}
      {...props}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={initials || "Avatar"}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  )
} 