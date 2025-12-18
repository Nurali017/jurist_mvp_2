'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Stats {
  requests: {
    total: number;
    today: number;
    thisWeek: number;
    byStatus: Record<string, number>;
  };
  lawyers: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface Lawyer {
  id: string;
  email: string;
  fullName: string;
  lawyerType: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingLawyers, setPendingLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadData();
  }, [hasHydrated, isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [statsRes, lawyersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLawyers({ status: 'PENDING', limit: 5 }),
      ]);
      setStats(statsRes.data);
      setPendingLawyers(lawyersRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.totalRequests')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.requests.total || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.todayRequests')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.requests.today || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.pendingLawyers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.lawyers.pending || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.approvedLawyers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats?.lawyers.approved || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mb-8 flex gap-4">
          <Link href={`/${locale}/admin/lawyers`}>
            <Button>{t('lawyers.title')}</Button>
          </Link>
          <Link href={`/${locale}/admin/requests`}>
            <Button variant="outline">{t('requests.title')}</Button>
          </Link>
        </div>

        {/* Pending Lawyers */}
        {pendingLawyers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('lawyers.title')} - {t('lawyers.filter.pending')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingLawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div>
                      <p className="font-medium">{lawyer.fullName}</p>
                      <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {lawyer.lawyerType === 'ADVOCATE' ? 'Адвокат' : 'Консультант'}
                      </p>
                    </div>
                    <Link href={`/${locale}/admin/lawyers/${lawyer.id}`}>
                      <Button size="sm">Просмотр</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
