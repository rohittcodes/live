'use client';

import { useAuth } from '@clerk/nextjs';
import { SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AuthNav() {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <UserButton />
        </>
      ) : (
        <SignInButton>
          <Button size="sm" variant="outline">Sign in</Button>
        </SignInButton>
      )}
    </div>
  );
}
