'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
};

const textColors: Record<ToastType, string> = {
  success: 'text-green-900 dark:text-green-100',
  error: 'text-red-900 dark:text-red-100',
  warning: 'text-amber-900 dark:text-amber-100',
  info: 'text-blue-900 dark:text-blue-100',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...props, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-[380px] max-w-[calc(100vw-2rem)]">
          <AnimatePresence>
            {toasts.map((t) => (
              <ToastPrimitive.Root key={t.id} asChild>
                <motion.div
                  initial={{ opacity: 0, x: 100, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={cn(
                    'rounded-lg border p-4 shadow-lg flex items-start gap-3',
                    bgColors[t.type]
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
                  <div className="flex-1 min-w-0">
                    <ToastPrimitive.Title
                      className={cn('font-medium', textColors[t.type])}
                    >
                      {t.title}
                    </ToastPrimitive.Title>
                    {t.description && (
                      <ToastPrimitive.Description
                        className={cn(
                          'mt-1 text-sm opacity-80',
                          textColors[t.type]
                        )}
                      >
                        {t.description}
                      </ToastPrimitive.Description>
                    )}
                  </div>
                  <ToastPrimitive.Close
                    onClick={() => removeToast(t.id)}
                    className={cn(
                      'flex-shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity',
                      textColors[t.type]
                    )}
                  >
                    <X className="h-4 w-4" />
                  </ToastPrimitive.Close>
                </motion.div>
              </ToastPrimitive.Root>
            ))}
          </AnimatePresence>
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
