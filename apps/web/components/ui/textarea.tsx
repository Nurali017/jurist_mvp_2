'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all duration-200',
              'hover:border-accent/50',
              'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive hover:border-destructive focus:border-destructive focus:ring-destructive/20',
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Animated focus glow */}
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={false}
            animate={{
              boxShadow: isFocused
                ? error
                  ? '0 0 0 3px hsl(var(--destructive) / 0.15)'
                  : '0 0 0 3px hsl(var(--accent) / 0.15)'
                : '0 0 0 0px transparent',
            }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Animated error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
