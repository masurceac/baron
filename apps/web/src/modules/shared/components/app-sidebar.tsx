'use client';

import {
  BarChartIcon,
  ChartLineIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListIcon,
  UsersIcon,
} from 'lucide-react';
import * as React from 'react';

import { getAppRoute } from '@/core/route';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@baron/ui/components/sidebar';
import { UserButton } from '@clerk/clerk-react';
import { NavMain } from './nav-main';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const nav = React.useMemo(
    () => [
      {
        title: 'Dashboard',
        url: getAppRoute('/app'),
        icon: LayoutDashboardIcon,
      },
      {
        title: 'Volume Profile Config',
        url: getAppRoute('/app/volume-profile-config'),
        icon: ListIcon,
      },
      {
        title: 'Analytics',
        url: '#',
        icon: BarChartIcon,
      },
      {
        title: 'Projects',
        url: '#',
        icon: FolderIcon,
      },
      {
        title: 'Team',
        url: '#',
        icon: UsersIcon,
      },
    ],
    [],
  );
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ChartLineIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Baron App.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav} />
        {/* <NavDocuments items={data.documents} /> 
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
