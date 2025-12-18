'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Clock, Banknote, Lock } from 'lucide-react';

const benefits = [
  { key: 'verified', icon: ShieldCheck },
  { key: 'fast', icon: Clock },
  { key: 'transparent', icon: Banknote },
  { key: 'secure', icon: Lock },
] as const;

export function BenefitsSection() {
  const t = useTranslations('home.benefits');

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          {t('title')}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ key, icon: Icon }) => (
            <div key={key} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-medium">{t(`${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
