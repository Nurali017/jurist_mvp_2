'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  // Remove leading 7 or 8 if present (we'll add +7 prefix)
  const cleanDigits = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits;

  // Limit to 10 digits (after +7)
  const limited = cleanDigits.slice(0, 10);

  if (!limited) return '';

  // Format: +7 (XXX) XXX-XX-XX
  let formatted = '+7';
  if (limited.length > 0) {
    formatted += ` (${limited.slice(0, 3)}`;
  }
  if (limited.length >= 3) {
    formatted += `) ${limited.slice(3, 6)}`;
  }
  if (limited.length >= 6) {
    formatted += `-${limited.slice(6, 8)}`;
  }
  if (limited.length >= 8) {
    formatted += `-${limited.slice(8, 10)}`;
  }

  return formatted;
}

function toRawPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // Ensure it starts with +7
  if (digits.startsWith('7')) {
    return `+${digits}`;
  }
  return `+7${digits}`;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, error, placeholder, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      if (!value) return '';
      return formatPhone(value);
    });

    React.useEffect(() => {
      if (value !== undefined) {
        const currentRaw = toRawPhone(displayValue);
        if (value !== currentRaw) {
          setDisplayValue(value ? formatPhone(value) : '');
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhone(inputValue);
      setDisplayValue(formatted);

      const rawValue = toRawPhone(formatted);
      onChange?.(rawValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // If empty, show +7 prefix on focus
      if (!displayValue) {
        setDisplayValue('+7 ');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // If only +7, clear the field
      if (displayValue === '+7 ' || displayValue === '+7') {
        setDisplayValue('');
        onChange?.('');
      }
      props.onBlur?.(e);
    };

    return (
      <div>
        <input
          type="tel"
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || '+7 (___) ___-__-__'}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
