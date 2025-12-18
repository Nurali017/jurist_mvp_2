'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const resetPasswordSchema = z.object({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tValidation = useTranslations('validation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const checkSession = async () => {
      // Supabase sends user to reset page with tokens in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session from URL params
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
        }
      } else {
        // Check if there's already a valid session (recovery mode)
        const { data: { session } } = await supabase.auth.getSession();
        setIsValidSession(!!session);
      }
    };

    checkSession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);

      // Sign out after password reset
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-destructive">Invalid or expired reset link</p>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-primary hover:underline"
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                <p className="text-center text-sm text-muted-foreground">
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    error={errors.password ? tValidation('password') : undefined}
                    {...register('password')}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    error={errors.confirmPassword ? tValidation('passwordMatch') : undefined}
                    {...register('confirmPassword')}
                  />
                </div>

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {t('submit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
