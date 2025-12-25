'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-8 text-3xl font-bold">{t('title')}</h1>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section1.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section1.content')}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section2.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section2.content')}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section3.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section3.content')}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section4.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section4.content')}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section5.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section5.content')}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('section6.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('section6.content')}
                </p>
              </section>

              <p className="text-sm text-muted-foreground mt-8">
                {t('lastUpdated')}: 25.12.2024
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
