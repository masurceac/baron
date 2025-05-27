import { ThemeSwitcher } from '@baron/ui-spa/theme-switcher';
import { Container } from '@baron/ui/components/container';
import { Separator } from '@baron/ui/components/separator';
import { UserButton } from '@clerk/clerk-react';
import { Outlet } from 'react-router-dom';

export function MainPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between flex-1 w-full overflow-x-auto overflow-y-auto">
      <nav className="border-b py-4">
        <Container className="flex justify-between">
          <div>
            <span className="italic">B-Trading</span>
          </div>
          <div className="flex space-x-4">
            <UserButton />
            <ThemeSwitcher />
          </div>
        </Container>
      </nav>
      <div className="flex-1 px-4 pt-8">
        <Outlet />
      </div>
      <Separator className="mt-8" />
      <footer>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          &copy; {new Date().getFullYear()} Baron Trading. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
