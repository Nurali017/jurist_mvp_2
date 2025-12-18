'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

function calculateStrength(password: string): {
  score: number;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    digit: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return { score, checks };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const t = useTranslations('auth.register.wizard');
  const { score, checks } = calculateStrength(password);

  const getStrengthLabel = () => {
    if (score === 0) return '';
    if (score === 1) return t('passwordStrength.weak');
    if (score === 2) return t('passwordStrength.fair');
    if (score === 3) return t('passwordStrength.good');
    return t('passwordStrength.strong');
  };

  const getStrengthColor = () => {
    if (score === 1) return 'bg-red-500';
    if (score === 2) return 'bg-orange-500';
    if (score === 3) return 'bg-yellow-500';
    if (score === 4) return 'bg-green-500';
    return 'bg-muted';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                level <= score ? getStrengthColor() : 'bg-muted'
              )}
            />
          ))}
        </div>
        {score > 0 && (
          <p className={cn(
            'text-xs font-medium',
            score === 1 && 'text-red-500',
            score === 2 && 'text-orange-500',
            score === 3 && 'text-yellow-600',
            score === 4 && 'text-green-500'
          )}>
            {getStrengthLabel()}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          {t('requirements.title')}
        </p>
        <ul className="space-y-1 text-xs">
          <RequirementItem met={checks.length} label={t('requirements.length')} />
          <RequirementItem met={checks.uppercase} label={t('requirements.uppercase')} />
          <RequirementItem met={checks.lowercase} label={t('requirements.lowercase')} />
          <RequirementItem met={checks.digit} label={t('requirements.digit')} />
        </ul>
      </div>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={cn(
      'flex items-center gap-2',
      met ? 'text-green-600' : 'text-muted-foreground'
    )}>
      <span className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full text-[10px]',
        met ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
      )}>
        {met ? '✓' : '○'}
      </span>
      {label}
    </li>
  );
}
