'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { lawyerApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RequestDetail {
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
  assignedLawyerId?: string;
  createdAt: string;
}

export default function RequestDetailPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.userType !== 'lawyer') {
      router.push(`/${locale}/login`);
      return;
    }

    loadRequest();
  }, [hasHydrated, isAuthenticated, user, requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await lawyerApi.getRequestDetails(requestId);
      setRequest(response.data);
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreferredContactLabel = (contact: string) => {
    switch (contact) {
      case 'PHONE':
        return 'Телефон';
      case 'EMAIL':
        return 'Email';
      case 'WHATSAPP':
        return 'WhatsApp';
      default:
        return 'Любой';
    }
  };

  if (loading) {
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

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">{tCommon('noResults')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline">{tCommon('back')}</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('requestDetails.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">{t('requestDetails.description')}:</span>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {request.description}
                </p>
              </div>

              <div>
                <span className="font-medium">{t('requestDetails.budget')}:</span>{' '}
                {formatCurrency(request.budget, request.currency)}
              </div>

              <div>
                <span className="font-medium">{t('requestDetails.status')}:</span>{' '}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    request.status === 'NEW'
                      ? 'bg-blue-100 text-blue-800'
                      : request.status === 'IN_PROGRESS'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <div>
                <span className="font-medium">{t('requestDetails.createdAt')}:</span>{' '}
                {formatDate(request.createdAt, locale)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('requestDetails.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">{t('requestDetails.contactName')}:</span>{' '}
                {request.contactName}
              </div>

              <div>
                <span className="font-medium">{t('requestDetails.phone')}:</span>{' '}
                <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                  {request.phone}
                </a>
              </div>

              {request.email && (
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                    {request.email}
                  </a>
                </div>
              )}

              <div>
                <span className="font-medium">{t('requestDetails.preferredContact')}:</span>{' '}
                {getPreferredContactLabel(request.preferredContact)}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
