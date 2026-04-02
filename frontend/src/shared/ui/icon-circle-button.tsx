import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function IconCircleButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
