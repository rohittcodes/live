import type { Metadata } from 'next';
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
  title: 'Live',
  description: 'Personal live streaming & video platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Runs before React hydration — prevents flash of wrong theme */}
          <script dangerouslySetInnerHTML={{ __html: `
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
        </body>
      </html>
    </ClerkProvider>
  );
}
