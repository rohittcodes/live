'use client';

import { SignUp } from '@clerk/nextjs';

export function SignUpClient() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <SignUp
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
