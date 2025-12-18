'use client';

import { Scale, Briefcase, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LawyerTypeCardProps {
  type: 'ADVOCATE' | 'CONSULTANT';
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const icons: Record<'ADVOCATE' | 'CONSULTANT', LucideIcon> = {
  ADVOCATE: Scale,
  CONSULTANT: Briefcase,
};

export function LawyerTypeCard({
  type,
  title,
  description,
  selected,
  onSelect,
}: LawyerTypeCardProps) {
  const Icon = icons[type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-muted-foreground/20 bg-background'
      )}
    >
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className={cn(
          'text-lg font-semibold',
          selected ? 'text-primary' : 'text-foreground'
        )}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}
