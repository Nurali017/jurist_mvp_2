'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  className?: string;
  error?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ options, value, onChange, name, className, error }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-wrap gap-2', className)}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-all',
              'hover:bg-muted/50',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-input',
              error && 'border-destructive'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="sr-only"
            />
            <div className="relative flex h-4 w-4 items-center justify-center">
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-colors',
                  value === option.value ? 'border-primary' : 'border-input'
                )}
              />
              <div
                className={cn(
                  'absolute h-2 w-2 rounded-full bg-primary transition-transform',
                  value === option.value ? 'scale-100' : 'scale-0'
                )}
              />
            </div>
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-all',
          'hover:bg-muted/50',
          checked ? 'border-primary bg-primary/5' : 'border-input',
          className
        )}
      >
        <input
          type="radio"
          ref={ref}
          checked={checked}
          className="sr-only"
          {...props}
        />
        <div className="relative flex h-4 w-4 items-center justify-center">
          <div
            className={cn(
              'h-4 w-4 rounded-full border-2 transition-colors',
              checked ? 'border-primary' : 'border-input'
            )}
          />
          <div
            className={cn(
              'absolute h-2 w-2 rounded-full bg-primary transition-transform',
              checked ? 'scale-100' : 'scale-0'
            )}
          />
        </div>
        {label && <span className="text-sm">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export { Radio, RadioGroup };
