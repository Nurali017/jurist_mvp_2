'use client';

import { useTranslations } from 'next-intl';
import { FileDropzone } from '../ui/FileDropzone';

interface DocumentsStepProps {
  lawyerType: 'ADVOCATE' | 'CONSULTANT' | null;
  files: {
    photo: File | null;
    diploma: File | null;
    license: File | null;
  };
  onFileChange: (field: 'photo' | 'diploma' | 'license', file: File | null) => void;
  errors?: {
    photo?: string;
    diploma?: string;
    license?: string;
  };
}

export function DocumentsStep({
  lawyerType,
  files,
  onFileChange,
  errors,
}: DocumentsStepProps) {
  const t = useTranslations('auth.register');
  const tWizard = useTranslations('auth.register.wizard');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{tWizard('steps.documents')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tWizard('documentsDescription')}
        </p>
      </div>

      <div className="space-y-6">
        <FileDropzone
          label={`${t('photo')} *`}
          accept="image/jpeg,image/png"
          maxSize={5}
          file={files.photo}
          onFileSelect={(file) => onFileChange('photo', file)}
          isImage
          error={errors?.photo}
        />

        <FileDropzone
          label={`${t('diploma')} *`}
          accept="application/pdf,image/jpeg,image/png"
          maxSize={20}
          file={files.diploma}
          onFileSelect={(file) => onFileChange('diploma', file)}
          error={errors?.diploma}
        />

        <FileDropzone
          label={`${lawyerType === 'ADVOCATE' ? t('advocateLicense') : t('consultantLicense')} *`}
          accept="application/pdf,image/jpeg,image/png"
          maxSize={20}
          file={files.license}
          onFileSelect={(file) => onFileChange('license', file)}
          error={errors?.license}
        />
      </div>
    </div>
  );
}
