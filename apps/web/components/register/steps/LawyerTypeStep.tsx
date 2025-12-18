'use client';

import { useTranslations } from 'next-intl';
import { LawyerTypeCard } from '../ui/LawyerTypeCard';

interface LawyerTypeStepProps {
  value: 'ADVOCATE' | 'CONSULTANT' | null;
  onChange: (value: 'ADVOCATE' | 'CONSULTANT') => void;
}

export function LawyerTypeStep({ value, onChange }: LawyerTypeStepProps) {
  const t = useTranslations('auth.register.wizard');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('steps.type')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('typeDescription')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LawyerTypeCard
          type="ADVOCATE"
          title={t('lawyerTypes.advocate.title')}
          description={t('lawyerTypes.advocate.description')}
          selected={value === 'ADVOCATE'}
          onSelect={() => onChange('ADVOCATE')}
        />
        <LawyerTypeCard
          type="CONSULTANT"
          title={t('lawyerTypes.consultant.title')}
          description={t('lawyerTypes.consultant.description')}
          selected={value === 'CONSULTANT'}
          onSelect={() => onChange('CONSULTANT')}
        />
      </div>
    </div>
  );
}
