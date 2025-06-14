import { Separator } from '@baron/ui/components/separator';
import { SidebarTrigger } from '@baron/ui/components/sidebar';
import { ReactNode } from 'react';

export function PageLayout(props: { title: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{props.title}</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2 px-8">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {props.children}
          </div>
        </div>
      </div>
    </>
  );
}
