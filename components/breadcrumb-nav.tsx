'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBreadcrumbLabels } from '@/components/breadcrumb-labels';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const LABELS: Record<string, string> = {
  videos: 'Videos',
  rooms: 'Rooms',
  stream: 'Stream',
  dashboard: 'Dashboard',
  streams: 'Streams',
  analytics: 'Analytics',
  settings: 'Settings',
  admin: 'Admin',
  new: 'New',
  upload: 'Upload',
};

function isUUID(s: string) {
  return /^[0-9a-f-]{36}$/i.test(s);
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const { labels } = useBreadcrumbLabels();
  const segments = pathname.split('/').filter(Boolean);

  // Home is always the root anchor
  const isHome = segments.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {isHome ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((seg, i) => {
              const href = '/' + segments.slice(0, i + 1).join('/');
              const isLast = i === segments.length - 1;
              const label = LABELS[seg] ?? labels[seg] ?? (isUUID(seg) ? '...' : seg);

              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
