'use client';

import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '../ui/PasswordInput';
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface PasswordStepProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  passwordValue: string;
}

export function PasswordStep({
  register,
  errors,
  passwordValue,
}: PasswordStepProps) {
  const t = useTranslations('auth.register');
  const tWizard = useTranslations('auth.register.wizard');
  const tValidation = useTranslations('validation');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{tWizard('steps.password')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tWizard('passwordDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')} *</Label>
          <PasswordInput
            id="password"
            placeholder={tWizard('placeholders.password')}
            error={errors.password ? tValidation('password') : undefined}
            {...register('password')}
          />
          <PasswordStrengthIndicator password={passwordValue} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')} *</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder={tWizard('placeholders.confirmPassword')}
            error={errors.confirmPassword ? tValidation('passwordMatch') : undefined}
            {...register('confirmPassword')}
          />
        </div>
      </div>
    </div>
  );
}
