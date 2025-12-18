'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col', className)}>
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative flex h-5 w-5 items-center justify-center">
            <input
              type="checkbox"
              ref={ref}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                'h-5 w-5 rounded border-2 transition-colors',
                'peer-checked:border-primary peer-checked:bg-primary',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                error ? 'border-destructive' : 'border-input'
              )}
            />
            <Check className="absolute h-3.5 w-3.5 scale-0 text-primary-foreground transition-transform peer-checked:scale-100" />
          </div>
          {label && (
            <span className={cn('text-sm', error && 'text-destructive')}>
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
