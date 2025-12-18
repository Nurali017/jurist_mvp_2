'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} Justice. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
