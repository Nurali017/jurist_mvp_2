'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleEmailVerification = async () => {
      // Supabase handles verification via URL hash params
      // Check if user is now verified
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('error');
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setStatus('success');
      } else {
        // Try to exchange the token from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus('error');
          } else {
            setStatus('success');
          }
        } else {
          // Check URL query params (alternative format)
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');
          const type = urlParams.get('type');

          if (token && type === 'signup') {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });

            if (verifyError) {
              setStatus('error');
            } else {
              setStatus('success');
            }
          } else {
            // No valid verification params found
            setStatus('error');
          }
        }
      }
    };

    handleEmailVerification();
  }, []);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(`/${locale}/login`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, locale, router]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              {status === 'loading' && (
                <>
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">{t('verifying')}</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h2 className="mb-2 text-xl font-semibold text-green-600">
                    {t('success')}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('redirecting', { seconds: countdown })}
                  </p>
                  <Link href={`/${locale}/login`}>
                    <Button>{t('login')}</Button>
                  </Link>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                  <h2 className="mb-2 text-xl font-semibold text-destructive">
                    {t('error')}
                  </h2>
                  <Link href={`/${locale}/login`}>
                    <Button variant="outline" className="mt-4">{t('login')}</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
