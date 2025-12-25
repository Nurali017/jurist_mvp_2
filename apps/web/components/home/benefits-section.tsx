'use client';

import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ShieldCheck, Clock, Banknote, Lock } from 'lucide-react';

const benefits = [
  { key: 'verified', icon: ShieldCheck },
  { key: 'fast', icon: Clock },
  { key: 'transparent', icon: Banknote },
  { key: 'secure', icon: Lock },
] as const;

export function BenefitsSection() {
  const t = useTranslations('home.benefits');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-16">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-3xl font-bold"
        >
          {t('title')}
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-xl bg-card border p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon with gradient */}
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light text-white shadow-lg"
              >
                <Icon className="h-7 w-7" />
              </motion.div>

              <h3 className="relative z-10 mb-2 font-semibold text-lg group-hover:text-primary transition-colors">
                {t(`${key}.title`)}
              </h3>
              <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                {t(`${key}.description`)}
              </p>

              {/* Decorative corner */}
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-gold to-gold-light opacity-0 group-hover:opacity-10 transition-all duration-300 group-hover:scale-150" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
