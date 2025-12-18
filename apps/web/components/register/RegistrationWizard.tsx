'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { authApi } from '@/lib/api';

import { StepIndicator } from './ui/StepIndicator';
import { LawyerTypeStep } from './steps/LawyerTypeStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { PasswordStep } from './steps/PasswordStep';
import { DocumentsStep } from './steps/DocumentsStep';

const TOTAL_STEPS = 4;

const registerSchema = z.object({
  lawyerType: z.enum(['ADVOCATE', 'CONSULTANT']),
  email: z.string().min(1).email(),
  fullName: z.string().min(2).max(200),
  iin: z.string().regex(/^\d{12}$/),
  phone: z.string().regex(/^\+7\d{10}$/),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegistrationWizard() {
  const t = useTranslations('auth.register');
  const tWizard = useTranslations('auth.register.wizard');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{
    photo: File | null;
    diploma: File | null;
    license: File | null;
  }>({
    photo: null,
    diploma: null,
    license: null,
  });
  const [fileErrors, setFileErrors] = useState<{
    photo?: string;
    diploma?: string;
    license?: string;
  }>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const lawyerType = watch('lawyerType');
  const password = watch('password') || '';
  const phone = watch('phone') || '';
  const iin = watch('iin') || '';

  const steps = [
    { label: tWizard('steps.type') },
    { label: tWizard('steps.info') },
    { label: tWizard('steps.password') },
    { label: tWizard('steps.documents') },
  ];

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return !!lawyerType;
      case 2:
        return await trigger(['email', 'fullName', 'iin', 'phone']);
      case 3:
        return await trigger(['password', 'confirmPassword']);
      case 4:
        const newFileErrors: typeof fileErrors = {};
        if (!files.photo) newFileErrors.photo = tValidation('fileRequired');
        if (!files.diploma) newFileErrors.diploma = tValidation('fileRequired');
        if (!files.license) newFileErrors.license = tValidation('fileRequired');
        setFileErrors(newFileErrors);
        return Object.keys(newFileErrors).length === 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFileChange = (field: 'photo' | 'diploma' | 'license', file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
    if (file) {
      setFileErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'confirmPassword') {
          formData.append(key, value);
        }
      });
      formData.append('photo', files.photo!);
      formData.append('diploma', files.diploma!);
      formData.append('license', files.license!);

      await authApi.register(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-600">
                {t('success')}
              </h2>
            </div>
            <Link href={`/${locale}/login`}>
              <Button className="mt-4">{t('login')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="space-y-6">
        <CardTitle className="text-center">{t('title')}</CardTitle>
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <LawyerTypeStep
              value={lawyerType}
              onChange={(value) => setValue('lawyerType', value)}
            />
          )}

          {currentStep === 2 && (
            <PersonalInfoStep
              register={register as any}
              errors={errors}
              phoneValue={phone}
              onPhoneChange={(value) => setValue('phone', value, { shouldValidate: true })}
              iinValue={iin}
              onIinChange={(value) => setValue('iin', value, { shouldValidate: true })}
            />
          )}

          {currentStep === 3 && (
            <PasswordStep
              register={register as any}
              errors={errors}
              passwordValue={password}
            />
          )}

          {currentStep === 4 && (
            <DocumentsStep
              lawyerType={lawyerType}
              files={files}
              onFileChange={handleFileChange}
              errors={fileErrors}
            />
          )}

          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tCommon('back')}
              </Button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1"
                disabled={currentStep === 1 && !lawyerType}
              >
                {tCommon('next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1"
                loading={isSubmitting}
              >
                {t('submit')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-primary hover:underline">
            {t('login')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
