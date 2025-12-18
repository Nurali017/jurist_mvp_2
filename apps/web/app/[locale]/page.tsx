'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BenefitsSection } from '@/components/home/benefits-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Radio } from '@/components/ui/radio';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { requestsApi } from '@/lib/api';

type RequestFormData = {
  description: string;
  budget: number;
  currency: 'KZT' | 'USD' | 'RUB';
  contactName: string;
  phone: string;
  email?: string;
  preferredContact: 'PHONE' | 'EMAIL' | 'ANY';
  consent: boolean;
};

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  const requestSchema = z.object({
    description: z.string()
      .min(50, { message: tValidation('minLength', { min: 50 }) })
      .max(2000, { message: tValidation('maxLength', { max: 2000 }) }),
    budget: z.number()
      .min(0, { message: tValidation('minLength', { min: 0 }) }),
    currency: z.enum(['KZT', 'USD', 'RUB']).default('KZT'),
    contactName: z.string()
      .min(2, { message: tValidation('minLength', { min: 2 }) })
      .max(100, { message: tValidation('maxLength', { max: 100 }) }),
    phone: z.string()
      .regex(/^\+7\d{10}$/, { message: tValidation('phone') }),
    email: z.string()
      .email({ message: tValidation('email') })
      .optional()
      .or(z.literal('')),
    preferredContact: z.enum(['PHONE', 'EMAIL', 'ANY']).default('ANY'),
    consent: z.boolean().refine((val) => val === true, { message: tCommon('required') }),
  }).superRefine((data, ctx) => {
    if (data.preferredContact === 'EMAIL' && (!data.email || data.email === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tCommon('required'),
        path: ['email'],
      });
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ requestNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    mode: 'onTouched',
    defaultValues: {
      budget: 0,
      currency: 'KZT',
      phone: '',
      preferredContact: 'ANY',
    },
  });

  const preferredContact = watch('preferredContact');

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { consent, ...requestData } = data;
      const response = await requestsApi.create({
        ...requestData,
        email: requestData.email || undefined,
      });

      setSuccess({ requestNumber: response.data.requestNumber });
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Request Form Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              {success ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                      <h2 className="mb-2 text-xl font-semibold text-green-600">
                        {t('requestForm.success')}
                      </h2>
                      <p className="text-lg">
                        {t('requestForm.requestNumber')}: <strong>{success.requestNumber}</strong>
                      </p>
                      <Button
                        className="mt-6"
                        onClick={() => setSuccess(null)}
                      >
                        {t('requestForm.newRequest')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('requestForm.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                          <span className="text-sm text-destructive">{error}</span>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="description">{t('requestForm.description')} *</Label>
                        <Textarea
                          id="description"
                          placeholder={t('requestForm.descriptionPlaceholder')}
                          rows={5}
                          error={errors.description?.message}
                          {...register('description')}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('requestForm.descriptionHint')}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="budget">{t('requestForm.budget')} *</Label>
                          <Controller
                            name="budget"
                            control={control}
                            render={({ field }) => (
                              <CurrencyInput
                                id="budget"
                                placeholder={t('requestForm.budgetPlaceholder')}
                                error={errors.budget?.message}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currency">{t('requestForm.currency')}</Label>
                          <Controller
                            name="currency"
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="KZT">KZT (₸)</SelectItem>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="RUB">RUB (₽)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="contactName">{t('requestForm.contactName')} *</Label>
                        <Input
                          id="contactName"
                          placeholder={t('requestForm.contactNamePlaceholder')}
                          error={errors.contactName?.message}
                          {...register('contactName')}
                        />
                      </div>

                      <div>
                        <Label>{t('requestForm.preferredContact')}</Label>
                        <Controller
                          name="preferredContact"
                          control={control}
                          render={({ field }) => (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Radio
                                name="preferredContact"
                                value="PHONE"
                                checked={field.value === 'PHONE'}
                                onChange={field.onChange}
                                label={t('requestForm.contactPhone')}
                              />
                              <Radio
                                name="preferredContact"
                                value="EMAIL"
                                checked={field.value === 'EMAIL'}
                                onChange={field.onChange}
                                label={t('requestForm.contactEmail')}
                              />
                              <Radio
                                name="preferredContact"
                                value="ANY"
                                checked={field.value === 'ANY'}
                                onChange={field.onChange}
                                label={t('requestForm.contactAny')}
                              />
                            </div>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="phone">{t('requestForm.phone')} *</Label>
                          <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                              <PhoneInput
                                id="phone"
                                error={errors.phone?.message}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">
                            {t('requestForm.email')}{preferredContact === 'EMAIL' && ' *'}
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t('requestForm.emailPlaceholder')}
                            error={errors.email?.message}
                            {...register('email')}
                          />
                        </div>
                      </div>

                      <Controller
                        name="consent"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            label={`${t('requestForm.consent')} *`}
                            error={errors.consent ? tCommon('required') : undefined}
                          />
                        )}
                      />

                      <Button type="submit" className="w-full" loading={isSubmitting}>
                        {t('requestForm.submit')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
