import * as React from 'react';

export const Select = ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (val: string) => void }) => {
  return <div className="relative inline-block w-full">{children}</div>;
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = '', children, ...props }, ref) => (
    <button ref={ref} className={`flex h-10 w-full items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none ${className}`} {...props}>
      {children}
    </button>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) => (
  <span>{children || placeholder}</span>
);

export const SelectContent = ({ children, align, className = '' }: { children: React.ReactNode; align?: string; className?: string }) => (
  <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md mt-1 ${className}`}>{children}</div>
);

export const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className = '', children, value, ...props }, ref) => (
    <div ref={ref} className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-xs outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`} {...props}>
      {children}
    </div>
  )
);
SelectItem.displayName = 'SelectItem';
