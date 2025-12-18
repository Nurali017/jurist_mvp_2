'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login(data.email, data.password);
      const { user, userType, accessToken, refreshToken } = response.data;

      await login({ ...user, userType }, accessToken, refreshToken);

      // Redirect based on user type
      if (userType === 'admin') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (message === 'Invalid credentials') {
        setError(t('invalidCredentials'));
      } else {
        setError(message || tCommon('error'));
      }
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

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div className="text-right">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                {t('submit')}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/register`} className="text-primary hover:underline">
                {t('register')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
