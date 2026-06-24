import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { BreadcrumbLabelsProvider } from '@/components/breadcrumb-labels';
import { getCurrentUser } from '@/lib/auth';
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
  icons: { icon: '/rohitt.png', apple: '/rohitt.png' },
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
  const [user, headersList] = await Promise.all([getCurrentUser(), headers()]);
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <ClerkProvider nonce={nonce}>
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
          <BreadcrumbLabelsProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar isSignedIn={!!user} isAdmin={user?.role === 'admin' && !!user} />
              <SidebarInset>
                <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mx-1 self-stretch" />
                  <BreadcrumbNav />
                </header>
                <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          </BreadcrumbLabelsProvider>
          </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
