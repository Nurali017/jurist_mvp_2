'use client';

import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';

interface FormData {
  email: string;
  fullName: string;
  iin: string;
  phone: string;
}

interface PersonalInfoStepProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  phoneValue: string;
  onPhoneChange: (value: string) => void;
  iinValue: string;
  onIinChange: (value: string) => void;
}

export function PersonalInfoStep({
  register,
  errors,
  phoneValue,
  onPhoneChange,
  iinValue,
  onIinChange,
}: PersonalInfoStepProps) {
  const t = useTranslations('auth.register');
  const tWizard = useTranslations('auth.register.wizard');
  const tValidation = useTranslations('validation');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{tWizard('steps.info')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tWizard('infoDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')} *</Label>
            <Input
              id="email"
              type="email"
              placeholder={tWizard('placeholders.email')}
              error={errors.email ? tValidation('email') : undefined}
              {...register('email')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('fullName')} *</Label>
            <Input
              id="fullName"
              placeholder={tWizard('placeholders.fullName')}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="iin">{t('iin')} *</Label>
            <Input
              id="iin"
              inputMode="numeric"
              maxLength={12}
              placeholder={tWizard('placeholders.iin')}
              error={errors.iin ? tValidation('iin') : undefined}
              value={iinValue}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                onIinChange(digits);
              }}
            />
            <p className="text-xs text-muted-foreground">{tWizard('hints.iin')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')} *</Label>
            <PhoneInput
              id="phone"
              value={phoneValue}
              onChange={onPhoneChange}
              error={errors.phone ? tValidation('phone') : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
