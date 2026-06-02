'use client';

import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="w-full p-4">
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none border border-border rounded-xl overflow-hidden',
            navbar: 'border-r border-border',
            pageScrollBox: 'p-6',
          },
        }}
      />
    </div>
  );
}
