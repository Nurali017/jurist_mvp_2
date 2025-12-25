'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BenefitsSection } from '@/components/home/benefits-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { StatsSection } from '@/components/home/stats-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Radio } from '@/components/ui/radio';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { useToast } from '@/components/ui/toast-provider';
import { FadeInUp } from '@/components/ui/motion';
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
  const { toast } = useToast();

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
      preferredContact: 'PHONE',
    },
  });

  const preferredContact = watch('preferredContact');

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);

    try {
      const { consent, ...requestData } = data;
      const response = await requestsApi.create({
        ...requestData,
        email: requestData.email || undefined,
      });

      setSuccess({ requestNumber: response.data.requestNumber });
      toast({
        type: 'success',
        title: t('requestForm.success'),
        description: `${t('requestForm.requestNumber')}: ${response.data.requestNumber}`,
      });
      reset();
    } catch (err: any) {
      toast({
        type: 'error',
        title: tCommon('error'),
        description: err.response?.data?.message || tCommon('error'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <FadeInUp>
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex-1 text-center md:text-left"
                >
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {t('title')}
                  </h1>
                  <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                    {t('subtitle')}
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-8"
                  >
                    <Button
                      size="lg"
                      className="text-base"
                      onClick={() => {
                        document.getElementById('request-form')?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      }}
                    >
                      {t('cta')}
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex-1 flex justify-center"
                >
                  <Image
                    src="/images/hero-illustration.png"
                    alt="Юридическая консультация"
                    width={400}
                    height={300}
                    className="w-full max-w-md h-auto"
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* Benefits Section */}
        <BenefitsSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Disclaimer Section */}
        <section className="border-t border-b border-muted bg-muted/30 py-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t('disclaimer.title')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('disclaimer.text')}{' '}
                <a href="/terms" className="underline hover:text-primary">
                  {t('disclaimer.terms')}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Request Form Section */}
        <FadeInUp delay={0.2}>
          <section id="request-form" className="py-16">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-2xl">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                          >
                            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                          </motion.div>
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
                  </motion.div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('requestForm.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                          {t('requestForm.submit')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </FadeInUp>
      </main>

      <Footer />
    </div>
  );
}
