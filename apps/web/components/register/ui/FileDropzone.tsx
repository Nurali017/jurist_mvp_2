'use client';

import * as React from 'react';
import { Upload, File, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { FilePreview } from './FilePreview';

interface FileDropzoneProps {
  accept: string;
  maxSize: number;
  onFileSelect: (file: File | null) => void;
  file: File | null;
  label: string;
  hint?: string;
  error?: string;
  isImage?: boolean;
}

export function FileDropzone({
  accept,
  maxSize,
  onFileSelect,
  file,
  label,
  hint,
  error,
  isImage = false,
}: FileDropzoneProps) {
  const t = useTranslations('auth.register.wizard');
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return selectedFile.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return selectedFile.type === type || selectedFile.type.startsWith(type.replace('*', ''));
    });

    if (!isValidType) {
      return;
    }

    const maxBytes = maxSize * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatAccept = () => {
    return accept
      .split(',')
      .map((t) => {
        const trimmed = t.trim();
        if (trimmed.includes('pdf')) return 'PDF';
        if (trimmed.includes('jpeg') || trimmed.includes('jpg')) return 'JPG';
        if (trimmed.includes('png')) return 'PNG';
        return trimmed;
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
  };

  if (file) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <FilePreview file={file} onRemove={handleRemove} isImage={isImage} />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-destructive bg-destructive/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {isImage ? (
            <ImageIcon className="h-6 w-6" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('fileUpload.drag')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t('fileUpload.formats', { formats: formatAccept() })} | {t('fileUpload.maxSize', { size: maxSize })}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
