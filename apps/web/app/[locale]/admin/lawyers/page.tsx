'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Lawyer {
  id: string;
  email: string;
  fullName: string;
  lawyerType: string;
  status: string;
  phone: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminLawyersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const urlStatus = searchParams.get('status') as StatusFilter | null;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    urlStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(urlStatus) ? urlStatus : 'all'
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadLawyers();
  }, [hasHydrated, isAuthenticated, user, statusFilter]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (search) {
        params.search = search;
      }
      const response = await adminApi.getLawyers(params);
      setLawyers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLawyers();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('lawyers.filter.pending');
      case 'APPROVED':
        return t('lawyers.filter.approved');
      case 'REJECTED':
        return t('lawyers.filter.rejected');
      default:
        return status;
    }
  };

  if (!hasHydrated || (loading && lawyers.length === 0)) {
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('lawyers.title')}</h1>
          <Link href={`/${locale}/admin`}>
            <Button variant="outline">{tCommon('back')}</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Status Filter */}
              <div className="flex gap-2">
                {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? t('lawyers.filter.all') : getStatusText(status)}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 md:ml-auto">
                <input
                  type="text"
                  placeholder={tCommon('search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">
                  {tCommon('search')}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Lawyers List */}
        <Card>
          <CardContent className="pt-6">
            {lawyers.length === 0 ? (
              <p className="text-center text-muted-foreground">{tCommon('noResults')}</p>
            ) : (
              <div className="space-y-4">
                {lawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{lawyer.fullName}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(lawyer.status)}`}
                        >
                          {getStatusText(lawyer.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {lawyer.lawyerType === 'ADVOCATE' ? 'Адвокат' : 'Консультант'} | {lawyer.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lawyer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/${locale}/admin/lawyers/${lawyer.id}`}>
                      <Button size="sm">{t('lawyers.viewDocuments')}</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
