import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import './globals.css';

const fontSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const fontHeading = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const fontMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'Live by rohittcodes',
    template: '%s · Live',
  },
  description: 'Personal live streaming & video platform by rohittcodes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Live by rohittcodes',
    title: 'Live by rohittcodes',
    description: 'Personal live streaming & video platform.',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@rohittcodes',
    title: 'Live by rohittcodes',
    description: 'Personal live streaming & video platform.',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <ClerkProvider nonce={nonce} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Runs before React hydration — prevents flash of wrong theme */}
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
            try {
              var t = localStorage.getItem('theme') || 'system';
              var r = t === 'system'
                ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                : t;
              document.documentElement.classList.add(r);
              document.documentElement.style.colorScheme = r;
            } catch(e) {}
          ` }} />
        </head>
        <body suppressHydrationWarning className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} antialiased font-sans`}>
          <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
