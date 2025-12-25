'use client';

import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileText, Users, MessageSquare, CheckCircle } from 'lucide-react';

const steps = [
  { key: 'submit', icon: FileText },
  { key: 'match', icon: Users },
  { key: 'discuss', icon: MessageSquare },
  { key: 'resolve', icon: CheckCircle },
] as const;

export function HowItWorksSection() {
  const t = useTranslations('home.howItWorks');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line - desktop only */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="text-center">
                    {/* Step number badge */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background border rounded-full px-2.5 py-0.5 text-xs font-semibold text-muted-foreground z-10">
                      {index + 1}
                    </div>

                    {/* Icon circle */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.15 + 0.2,
                        type: 'spring',
                        stiffness: 300,
                      }}
                      className="z-10 mx-auto mb-4"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light text-white shadow-lg mx-auto">
                        <Icon className="h-8 w-8" />
                      </div>
                    </motion.div>

                    <h3 className="font-semibold text-lg mb-2">
                      {t(`${step.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`${step.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
