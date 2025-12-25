'use client';

import { motion, useInView, type HTMLMotionProps } from 'framer-motion';
import { useRef, useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { springTransition } from '@/lib/animations';

interface MotionDivProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

// Scroll-triggered fade-in-up component
export function FadeInUp({
  children,
  delay = 0,
  duration = 0.5,
  once = true,
  amount = 0.3,
  className,
  ...props
}: MotionDivProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered fade-in component
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  once = true,
  amount = 0.3,
  className,
  ...props
}: MotionDivProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered scale-in component
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  once = true,
  amount = 0.3,
  className,
  ...props
}: MotionDivProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger children container
interface StaggerContainerProps extends MotionDivProps {
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  ...props
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger child item
export function StaggerItem({
  children,
  className,
  ...props
}: Omit<MotionDivProps, 'delay' | 'duration' | 'once' | 'amount'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: 'easeOut' },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover wrapper
interface ScaleOnHoverProps extends MotionDivProps {
  scale?: number;
}

export function ScaleOnHover({
  children,
  scale = 1.02,
  className,
  ...props
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Lift on hover wrapper
interface LiftOnHoverProps extends MotionDivProps {
  lift?: number;
}

export function LiftOnHover({
  children,
  lift = -4,
  className,
  ...props
}: LiftOnHoverProps) {
  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated counter for numbers
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
  className,
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(easeOut * value));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

