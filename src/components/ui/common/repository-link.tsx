import * as React from 'react';
import { cn } from '@/lib/utils';

interface RepositoryLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> {
  url: string;
}

function getRepositoryLabel(url: string) {
  return url.replace(/^https:\/\/github\.com\//, '');
}

export function RepositoryLink({ url, className, rel, target, ...props }: RepositoryLinkProps) {
  const label = getRepositoryLabel(url);

  return (
    <a
      href={url}
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      title={label}
      aria-label={`Open repository ${label}`}
      className={cn(
        'inline-block max-w-full min-w-0 align-top text-sm text-primary hover:text-primary/80',
        className
      )}
      {...props}
    >
      <span className="line-clamp-2 max-w-full whitespace-normal break-words [overflow-wrap:anywhere]">
        {label}
      </span>
    </a>
  );
}
