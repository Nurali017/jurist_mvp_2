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

interface Request {
  id: string;
  requestNumber: string;
  description: string;
  budget: number;
  currency: string;
  contactName: string;
  phone: string;
  email?: string;
  preferredContact: string;
  status: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'NEW' | 'IN_PROGRESS' | 'CLOSED' | 'SPAM';

export default function AdminRequestsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadRequests();
  }, [hasHydrated, isAuthenticated, user, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: { status?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminApi.getRequests(params);
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateRequestStatus(id, newStatus);
      await loadRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены что хотите удалить эту заявку?')) return;

    try {
      await adminApi.deleteRequest(id);
      await loadRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      case 'SPAM':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'Новая';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'CLOSED':
        return 'Закрыта';
      case 'SPAM':
        return 'Спам';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!hasHydrated || (loading && requests.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('requests.title')}</h1>
            <Link href={`/${locale}/admin`}>
              <Button variant="outline">{tCommon('back')}</Button>
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold">{t('requests.title')}</h1>
          <Link href={`/${locale}/admin`}>
            <Button variant="outline">{tCommon('back')}</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'NEW', 'IN_PROGRESS', 'CLOSED', 'SPAM'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Все' : getStatusText(status)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">{tCommon('noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{request.requestNumber}</CardTitle>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm line-clamp-3">{request.description}</p>

                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="font-medium">Бюджет:</span>{' '}
                      {formatCurrency(request.budget, request.currency)}
                    </div>
                    <div>
                      <span className="font-medium">Контакт:</span> {request.contactName}
                    </div>
                    <div>
                      <span className="font-medium">Телефон:</span> {request.phone}
                    </div>
                    {request.email && (
                      <div>
                        <span className="font-medium">Email:</span> {request.email}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Дата:</span>{' '}
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    {request.status === 'SPAM' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(request.id, 'NEW')}
                      >
                        Восстановить
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(request.id, 'SPAM')}
                      >
                        {t('requests.markSpam')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(request.id)}
                    >
                      {tCommon('delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
