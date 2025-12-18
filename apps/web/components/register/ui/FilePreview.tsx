'use client';

import * as React from 'react';
import { FileText, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  isImage?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ file, onRemove, isImage = false }: FilePreviewProps) {
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isImage && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      {preview ? (
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          {file.type.includes('pdf') ? (
            <FileText className="h-6 w-6 text-red-500" />
          ) : file.type.startsWith('image/') ? (
            <ImageIcon className="h-6 w-6 text-blue-500" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
