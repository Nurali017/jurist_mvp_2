'use client';

import { Header } from '@/components/layout/header';
import { RegistrationWizard } from '@/components/register/RegistrationWizard';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RegistrationWizard />
      </main>
    </div>
  );
}
