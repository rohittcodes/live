'use client';

import { SignIn } from '@clerk/nextjs';

export function SignInClient() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-sm',
            cardBox: 'w-full shadow-none border border-border rounded-xl',
          },
        }}
      />
    </div>
  );
}
