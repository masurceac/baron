import { Separator } from '@baron/ui/components/separator';
import { Outlet } from 'react-router-dom';

export function MainPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between flex-1 w-full overflow-x-auto overflow-y-auto">
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
