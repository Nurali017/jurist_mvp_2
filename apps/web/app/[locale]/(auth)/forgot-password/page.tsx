'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { authApi } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                  {t('success')}
                </div>
                <Link
                  href={`/${locale}/login`}
                  className="block text-center text-sm text-primary hover:underline"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {t('submit')}
                </Button>
              </form>
            )}
          </CardContent>
          {!isSuccess && (
            <CardFooter className="justify-center">
              <Link
                href={`/${locale}/login`}
                className="text-sm text-muted-foreground hover:underline"
              >
                {t('backToLogin')}
              </Link>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
