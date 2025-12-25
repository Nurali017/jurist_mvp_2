'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Fire and forget logout API call
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
    logout();
    router.push(`/${locale}`);
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logo.png"
            alt="QQK.KZ"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex gap-1 rounded-md border p-1">
            <button
              onClick={() => switchLocale('kk')}
              className={`rounded px-2 py-1 text-sm ${
                locale === 'kk' ? 'bg-primary text-white' : ''
              }`}
            >
              ҚАЗ
            </button>
            <button
              onClick={() => switchLocale('ru')}
              className={`rounded px-2 py-1 text-sm ${
                locale === 'ru' ? 'bg-primary text-white' : ''
              }`}
            >
              РУ
            </button>
          </div>

          {isAuthenticated && user ? (
            <>
              {user.userType === 'admin' ? (
                <Link href={`/${locale}/admin`}>
                  <Button variant="ghost">{t('admin')}</Button>
                </Link>
              ) : (
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost">{t('dashboard')}</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>
                {t('logout')}
              </Button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`}>
                <Button variant="ghost">{t('login')}</Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button>{t('register')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
