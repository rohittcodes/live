import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { BreadcrumbLabelsProvider } from '@/components/breadcrumb-labels';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
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
  );
}
