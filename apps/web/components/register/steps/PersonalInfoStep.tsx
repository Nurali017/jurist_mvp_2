'use client';

import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { authApi } from '@/lib/api';

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
  emailValue: string;
  onEmailChange: (value: string) => void;
}

// Validate email format
function validateEmail(email: string): boolean {
  if (email.length === 0) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Kazakhstan IIN
function validateIIN(iin: string): { isValid: boolean; error?: string } {
  if (iin.length === 0) return { isValid: false };
  if (iin.length < 12) return { isValid: false, error: 'incomplete' };
  if (iin.length !== 12) return { isValid: false, error: 'length' };

  // Check birth date (first 6 digits: YYMMDD)
  const month = parseInt(iin.slice(2, 4));
  const day = parseInt(iin.slice(4, 6));

  if (month < 1 || month > 12) return { isValid: false, error: 'month' };
  if (day < 1 || day > 31) return { isValid: false, error: 'day' };

  // 7th digit: century and gender (1-6 valid)
  const genderCentury = parseInt(iin[6]);
  if (genderCentury < 1 || genderCentury > 6) return { isValid: false, error: 'gender' };

  // Checksum validation (12th digit)
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(iin[i]) * weights1[i];
  }
  let checkDigit = sum % 11;

  if (checkDigit === 10) {
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(iin[i]) * weights2[i];
    }
    checkDigit = sum % 11;
  }

  if (checkDigit !== parseInt(iin[11])) {
    return { isValid: false, error: 'checksum' };
  }

  return { isValid: true };
}

export function PersonalInfoStep({
  register,
  errors,
  phoneValue,
  onPhoneChange,
  iinValue,
  onIinChange,
  emailValue,
  onEmailChange,
}: PersonalInfoStepProps) {
  const t = useTranslations('auth.register');
  const tWizard = useTranslations('auth.register.wizard');
  const tValidation = useTranslations('validation');

  const iinValidation = useMemo(() => validateIIN(iinValue), [iinValue]);
  const showIinStatus = iinValue.length > 0;

  const isEmailFormatValid = useMemo(() => validateEmail(emailValue), [emailValue]);
  const showEmailStatus = emailValue.length > 0;

  // Email availability check
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset state if email is empty or invalid format
    if (!isEmailFormatValid) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    // Debounce API call
    setCheckingEmail(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await authApi.checkEmail(emailValue);
        setEmailAvailable(response.data.available);
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [emailValue, isEmailFormatValid]);

  // Email is valid only if format is valid AND it's available
  const isEmailValid = isEmailFormatValid && emailAvailable === true;

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
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={tWizard('placeholders.email')}
                error={
                  showEmailStatus && !isEmailFormatValid
                    ? tValidation('email')
                    : emailAvailable === false
                    ? tValidation('emailTaken')
                    : undefined
                }
                className={
                  showEmailStatus
                    ? isEmailValid
                      ? 'border-green-500 focus:ring-green-500 pr-10'
                      : (isEmailFormatValid && emailAvailable === false) || !isEmailFormatValid
                      ? 'border-red-500 focus:ring-red-500 pr-10'
                      : 'pr-10'
                    : ''
                }
                value={emailValue}
                onChange={(e) => onEmailChange(e.target.value)}
              />
              {showEmailStatus && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingEmail ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : isEmailValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isEmailFormatValid && emailAvailable === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : !isEmailFormatValid ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
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
            <div className="relative">
              <Input
                id="iin"
                inputMode="numeric"
                maxLength={12}
                placeholder={tWizard('placeholders.iin')}
                error={
                  iinValue.length === 12 && !iinValidation.isValid
                    ? tValidation('iin')
                    : undefined
                }
                className={
                  showIinStatus
                    ? iinValidation.isValid
                      ? 'border-green-500 focus:ring-green-500 pr-10'
                      : iinValue.length === 12
                      ? 'border-red-500 focus:ring-red-500 pr-10'
                      : 'pr-10'
                    : ''
                }
                value={iinValue}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  onIinChange(digits);
                }}
              />
              {showIinStatus && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {iinValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : iinValue.length === 12 ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {iinValue.length}/12
                    </span>
                  )}
                </div>
              )}
            </div>
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
