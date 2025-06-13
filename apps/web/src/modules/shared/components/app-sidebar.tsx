'use client';

import {
  ChartBarStackedIcon,
  ChartCandlestickIcon,
  FolderIcon,
  LayoutDashboardIcon,
} from 'lucide-react';
import * as React from 'react';

import { getAppRoute } from '@/core/route';
import { ThemeSwitcher } from '@baron/ui-spa/theme-switcher';
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
        end: true,
        icon: LayoutDashboardIcon,
      },
      {
        title: 'FRVP',
        url: getAppRoute('/app/frvp'),
        end: false,
        icon: ChartBarStackedIcon,
      },
      {
        title: 'Info Bars',
        url: getAppRoute('/app/info-bars/list'),
        end: true,
        icon: ChartCandlestickIcon,
      },
      {
        title: 'Simulation',
        url: getAppRoute('/app/simulation'),
        icon: FolderIcon,
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
                <img src="/logo.png" className="h-5 w-5" />
                <span className="text-base font-semibold">Baron Trade</span>
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
        <ThemeSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
