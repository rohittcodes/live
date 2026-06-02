'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HomeIcon,
  VideoIcon,
  MicIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  SettingsIcon,
  ChevronRightIcon,
  LogOutIcon,
  BarChart2Icon,
  ShieldIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  UploadIcon,
  MessageSquareIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { SignInButton, useUser, SignOutButton } from '@clerk/nextjs';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const browseItems = [
  { title: 'Home', href: '/', icon: HomeIcon },
  { title: 'Videos', href: '/videos', icon: VideoIcon },
  { title: 'Rooms', href: '/rooms', icon: MicIcon },
  { title: 'Community', href: '/community', icon: MessageSquareIcon },
  { title: 'Creators', href: '/creators', icon: UsersIcon },
];

const dashboardSubItems = [
  { title: 'Overview', href: '/dashboard' },
  { title: 'Streams', href: '/dashboard/streams' },
  { title: 'Videos', href: '/dashboard/videos' },
  { title: 'Community', href: '/dashboard/community' },
  { title: 'Analytics', href: '/dashboard/analytics' },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-0.5 group-data-[collapsible=icon]:hidden">
      {([ ['light', SunIcon], ['system', MonitorIcon], ['dark', MoonIcon] ] as const).map(([t, Icon]) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`flex flex-1 items-center justify-center rounded p-1 transition-colors ${
            mounted && theme === t
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
          }`}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function UserFooter() {
  const { user } = useUser();
  if (!user) return null;

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase() || user.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col gap-2">
      <ThemeToggle />
      <div className="flex items-center gap-2 rounded-lg px-1 py-1">
        <Avatar size="sm">
          <AvatarImage src={user.imageUrl} alt={user.fullName ?? ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
            {user.fullName ?? user.username}
          </span>
          <span className="truncate text-xs leading-tight text-sidebar-foreground/50">
            {user.primaryEmailAddress?.emailAddress}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
            >
              <SettingsIcon className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <SignOutButton>
              <button className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                <LogOutIcon className="size-4" />
              </button>
            </SignOutButton>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

interface AppSidebarProps {
  /** Resolved server-side — never flashes on hydration */
  isSignedIn?: boolean;
  isAdmin?: boolean;
}

export function AppSidebar({ isSignedIn = false, isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  return (
    <Sidebar>
      {/* Brand header */}
      <SidebarHeader className="h-12 border-b border-sidebar-border justify-center">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground leading-none">
              Live
            </span>
            <span className="text-[10px] text-sidebar-foreground/40 leading-none mt-0.5">
              by rohittcodes
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Browse — public */}
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {browseItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Creator — admin only (server-verified) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Creator</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible defaultOpen={isDashboard} className="group/collapsible">
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isDashboard} tooltip="Dashboard" asChild>
                      <CollapsibleTrigger className="w-full">
                        <LayoutDashboardIcon />
                        <span>Dashboard</span>
                        <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {dashboardSubItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.href}>
                            <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                              <Link href={sub.href}>{sub.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/stream/new'} tooltip="Go Live">
                    <Link href="/stream/new">
                      <PlusCircleIcon />
                      <span>Go Live</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/rooms/new'} tooltip="New Room">
                    <Link href="/rooms/new">
                      <MicIcon />
                      <span>New Room</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/videos/upload'} tooltip="Upload Video">
                    <Link href="/videos/upload">
                      <UploadIcon />
                      <span>Upload Video</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard/analytics'}
                    tooltip="Analytics"
                  >
                    <Link href="/dashboard/analytics">
                      <BarChart2Icon />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin — admin role only (server-verified) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isAdminPath}
                    tooltip="Admin"
                  >
                    <Link href="/admin">
                      <ShieldIcon />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {isSignedIn ? (
          <UserFooter />
        ) : (
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <SignInButton>
              <Button size="sm" variant="secondary" className="w-full">
                Sign in
              </Button>
            </SignInButton>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
