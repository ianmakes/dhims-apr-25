import React from 'react';
import { cn } from '@/lib/utils';
import { WpBreadcrumbs } from './breadcrumb';
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: {
    name: string;
    href: string;
    current?: boolean;
  }[];
  actions?: React.ReactNode;
  className?: string;
}
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className
}: PageHeaderProps) {
  return <div className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <WpBreadcrumbs items={breadcrumbs} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium leading-none tracking-tight text-wp-text-primary text-left">{title}</h1>
          {description && <p className="mt-2 text-sm text-wp-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
    </div>;
}