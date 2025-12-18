'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface LawyerDetail {
  id: string;
  email: string;
  fullName: string;
  lawyerType: string;
  iin: string;
  phone: string;
  status: string;
  rejectionReason?: string;
  photoUrl?: string;
  diplomaUrl?: string;
  licenseUrl?: string;
  createdAt: string;
  moderatedAt?: string;
}

export default function AdminLawyerDetailPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lawyerId = params.id as string;
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [lawyer, setLawyer] = useState<LawyerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadLawyer();
  }, [hasHydrated, isAuthenticated, user, lawyerId]);

  const loadLawyer = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLawyerDetails(lawyerId);
      setLawyer(response.data);
    } catch (error) {
      console.error('Failed to load lawyer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Вы уверены что хотите одобрить этого юриста?')) return;

    setActionLoading(true);
    try {
      await adminApi.approveLawyer(lawyerId);
      await loadLawyer();
    } catch (error) {
      console.error('Failed to approve lawyer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    try {
      await adminApi.rejectLawyer(lawyerId, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      await loadLawyer();
    } catch (error) {
      console.error('Failed to reject lawyer:', error);
    } finally {
      setActionLoading(false);
    }
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

  if (!lawyer) {
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
          <h1 className="text-2xl font-bold">{lawyer.fullName}</h1>
          <Link href={`/${locale}/admin/lawyers`}>
            <Button variant="outline">{tCommon('back')}</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Статус:</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(lawyer.status)}`}>
                  {lawyer.status}
                </span>
              </div>

              {lawyer.rejectionReason && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">Причина отклонения:</p>
                  <p className="text-sm text-red-700">{lawyer.rejectionReason}</p>
                </div>
              )}

              <div>
                <span className="font-medium">Тип:</span>{' '}
                {lawyer.lawyerType === 'ADVOCATE' ? 'Адвокат' : 'Юридический консультант'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lawyer.email}
              </div>
              <div>
                <span className="font-medium">Телефон:</span> {lawyer.phone}
              </div>
              <div>
                <span className="font-medium">ИИН:</span> {lawyer.iin}
              </div>
              <div>
                <span className="font-medium">Дата регистрации:</span>{' '}
                {new Date(lawyer.createdAt).toLocaleString()}
              </div>
              {lawyer.moderatedAt && (
                <div>
                  <span className="font-medium">Дата модерации:</span>{' '}
                  {new Date(lawyer.moderatedAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Документы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lawyer.photoUrl && (
                <div>
                  <p className="mb-2 font-medium">Фотография:</p>
                  <a
                    href={lawyer.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Открыть фото
                  </a>
                </div>
              )}

              {lawyer.diplomaUrl && (
                <div>
                  <p className="mb-2 font-medium">Диплом:</p>
                  <a
                    href={lawyer.diplomaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Открыть документ
                  </a>
                </div>
              )}

              {lawyer.licenseUrl && (
                <div>
                  <p className="mb-2 font-medium">
                    {lawyer.lawyerType === 'ADVOCATE' ? 'Удостоверение адвоката' : 'Выписка из палаты'}:
                  </p>
                  <a
                    href={lawyer.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Открыть документ
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {lawyer.status === 'PENDING' && (
          <Card className="mt-6">
            <CardContent className="flex gap-4 pt-6">
              <Button onClick={handleApprove} disabled={actionLoading}>
                {t('lawyers.approve')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                {t('lawyers.reject')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t('lawyers.rejectReason')}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-md border p-3"
                  rows={4}
                  placeholder="Укажите причину отклонения..."
                />
                <div className="mt-4 flex gap-4">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                  >
                    {t('lawyers.reject')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                    {tCommon('cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
