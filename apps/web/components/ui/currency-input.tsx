'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
}

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseNumber(value: string): number {
  const digits = value.replace(/\s/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, error, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value && value > 0 ? formatNumber(String(value)) : ''
    );

    React.useEffect(() => {
      if (value !== undefined && value !== parseNumber(displayValue)) {
        setDisplayValue(value && value > 0 ? formatNumber(String(value)) : '');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatNumber(inputValue);
      setDisplayValue(formatted);

      const numericValue = parseNumber(formatted);
      onChange?.(numericValue);
    };

    return (
      <div>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
