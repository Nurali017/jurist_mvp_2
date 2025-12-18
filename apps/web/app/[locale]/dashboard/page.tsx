'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { lawyerApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LawyerProfile {
  id: string;
  email: string;
  lawyerType: string;
  fullName: string;
  status: string;
  rejectionReason?: string;
}

interface Request {
  id: string;
  requestNumber: string;
  description: string;
  budget: number;
  currency: string;
  contactName: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before checking auth
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || user?.userType !== 'lawyer') {
      router.push(`/${locale}/login`);
      return;
    }

    loadData();
  }, [hasHydrated, isAuthenticated, user]);

  const loadData = async () => {
    try {
      const profileRes = await lawyerApi.getProfile();
      setProfile(profileRes.data);

      if (profileRes.data.status === 'APPROVED') {
        const requestsRes = await lawyerApi.getRequests({ limit: 10 });
        setRequests(requestsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{profile?.fullName}</CardTitle>
              <StatusBadge status={profile?.status || ''} />
            </div>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.status === 'PENDING' && (
              <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">
                <p className="font-medium">{t('status.pending')}</p>
                <p className="mt-1 text-sm">{t('status.pendingMessage')}</p>
              </div>
            )}

            {profile?.status === 'REJECTED' && (
              <div className="rounded-md bg-red-50 p-4 text-red-800">
                <p className="font-medium">{t('status.rejected')}</p>
                <p className="mt-2">
                  <strong>{t('status.rejectionReason')}:</strong> {profile.rejectionReason}
                </p>
                <Button className="mt-4" onClick={() => router.push(`/${locale}/dashboard/profile`)}>
                  {t('profile.resubmit')}
                </Button>
              </div>
            )}

            {profile?.status === 'APPROVED' && (
              <div className="rounded-md bg-green-50 p-4 text-green-800">
                <p className="font-medium">{t('status.approved')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests List (only for approved lawyers) */}
        {profile?.status === 'APPROVED' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('requests.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-md border p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/${locale}/dashboard/requests/${request.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{request.requestNumber}</p>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(request.budget, request.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(request.createdAt, locale)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('dashboard.status');

  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    PENDING: t('pending'),
    APPROVED: t('approved'),
    REJECTED: t('rejected'),
  };

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
