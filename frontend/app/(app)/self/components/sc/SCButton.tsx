import React from 'react';

interface SCButtonProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'primary-outline' | 'secondary' | 'secondary-outline' | 'success' | 'success-outline' | 'danger' | 'danger-outline';
  size?: 'auto' | 'sm' | 'md' | 'lg' | 'xl';
  hidden?: boolean;
  action?: () => void;
  children?: React.ReactNode;
}

const SCButton: React.FC<SCButtonProps> = ({
  variant = 'primary',
  size = 'md',
  hidden = false,
  className = '',
  action = () => {},
  disabled,
  children,
  label,
  ...props
}) => {
  if (hidden) return null;

  const btnClasses = (() => {
    const all = [
      'sc-btn',
      `sc-btn-${variant}`,
      className,
      `sc-btn-${size}`,
      'bg-[#7500FF] text-white hover:bg-[#7500FF]/90'
    ]
      .join(' ')
      .split(' ');
    const unique = [...new Set(all)];
    return unique.join(' ');
  })();

  const btnChildren = children || label || null;

  return (
    <button
      className={btnClasses}
      onClick={action}
      disabled={disabled}
      {...props}
    >
      {btnChildren}
    </button>
  );
};

export default SCButton; 